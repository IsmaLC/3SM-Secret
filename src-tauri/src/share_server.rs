use tiny_http::{Server, Response, Header, Method, StatusCode};
use crate::share::ShareStore;
use crate::tunnel::TunnelManager;

const EMBEDDED_HTML: &str = include_str!("embedded_share_viewer.html");

fn cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
        Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap(),
        Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type, Authorization, Pragma, Cache-Control"[..]).unwrap(),
        Header::from_bytes(&b"Cache-Control"[..], &b"no-store, no-cache, must-revalidate, max-age=0"[..]).unwrap(),
        Header::from_bytes(&b"Pragma"[..], &b"no-cache"[..]).unwrap(),
    ]
}

fn base64_encode(data: &[u8]) -> String {
    const B64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };
        let triple = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);
        out.push(B64_ALPHABET[((triple >> 18) & 0x3F) as usize] as char);
        out.push(B64_ALPHABET[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            out.push(B64_ALPHABET[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(B64_ALPHABET[(triple & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

#[derive(serde::Deserialize)]
struct PostShareBody {
    #[serde(rename = "shareId")]
    share_id: String,
    ciphertext: String,
    nonce: String,
    #[serde(rename = "ttlMinutes")]
    ttl_minutes: Option<u64>,
}

fn b64_decode(input: &str) -> Result<Vec<u8>, String> {
    let clean = input.trim();
    if clean.is_empty() {
        return Ok(Vec::new());
    }
    let mut bytes = Vec::with_capacity(clean.len() * 3 / 4);
    let mut buf = [0u8; 4];
    let mut buf_len = 0;

    for &b in clean.as_bytes() {
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            b'=' => continue,
            b' ' | b'\n' | b'\r' | b'\t' => continue,
            _ => return Err("Carácter base64 no válido".to_string()),
        };
        buf[buf_len] = val;
        buf_len += 1;
        if buf_len == 4 {
            let triple = ((buf[0] as u32) << 18) | ((buf[1] as u32) << 12) | ((buf[2] as u32) << 6) | (buf[3] as u32);
            bytes.push(((triple >> 16) & 0xFF) as u8);
            bytes.push(((triple >> 8) & 0xFF) as u8);
            bytes.push((triple & 0xFF) as u8);
            buf_len = 0;
        }
    }

    if buf_len == 2 {
        let val = ((buf[0] as u32) << 18) | ((buf[1] as u32) << 12);
        bytes.push(((val >> 16) & 0xFF) as u8);
    } else if buf_len == 3 {
        let val = ((buf[0] as u32) << 18) | ((buf[1] as u32) << 12) | ((buf[2] as u32) << 6);
        bytes.push(((val >> 16) & 0xFF) as u8);
        bytes.push(((val >> 8) & 0xFF) as u8);
    }

    Ok(bytes)
}

pub fn start_native_share_server(
    port: u16,
    share_store: ShareStore,
    tunnel_manager: TunnelManager,
) {
    std::thread::spawn(move || {
        let addr = format!("127.0.0.1:{}", port);
        let server = match Server::http(&addr) {
            Ok(s) => {
                println!("[3SM Secret] 🚀 Servidor nativo de compartición activo en {}", addr);
                s
            }
            Err(e) => {
                eprintln!("[3SM Secret] Error iniciando servidor en {}: {}", addr, e);
                return;
            }
        };

        for mut request in server.incoming_requests() {
            let url_path = request.url().to_string();
            let path_only = url_path.split('?').next().unwrap_or("/");

            // 1. Manejo de CORS Preflight
            if request.method() == &Method::Options {
                let mut resp = Response::empty(StatusCode(204));
                for h in cors_headers() {
                    resp.add_header(h);
                }
                let _ = request.respond(resp);
                continue;
            }

            // 2. Consulta de estado del túnel
            if path_only == "/api/tunnel-status" || path_only == "/api/tunnel-url" {
                let status_json = serde_json::json!({
                    "ready": tunnel_manager.is_ready(),
                    "url": tunnel_manager.get_url(),
                    "connecting": tunnel_manager.is_connecting()
                });
                let mut resp = Response::from_string(status_json.to_string())
                    .with_status_code(StatusCode(200));
                resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                for h in cors_headers() {
                    resp.add_header(h);
                }
                let _ = request.respond(resp);
                continue;
            }

            // 3. Consumir secreto efímero GET /api/shares/{id}
            if path_only.starts_with("/api/shares/") && request.method() == &Method::Get {
                let share_id = path_only.trim_start_matches("/api/shares/").trim();
                match share_store.consume_share(share_id) {
                    Ok((ciphertext, nonce)) => {
                        let json = serde_json::json!({
                            "ciphertext": base64_encode(&ciphertext),
                            "nonce": hex::encode(nonce)
                        });
                        let mut resp = Response::from_string(json.to_string())
                            .with_status_code(StatusCode(200));
                        resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                        for h in cors_headers() {
                            resp.add_header(h);
                        }
                        let _ = request.respond(resp);
                    }
                    Err(err_msg) => {
                        let json = serde_json::json!({
                            "error": err_msg
                        });
                        let mut resp = Response::from_string(json.to_string())
                            .with_status_code(StatusCode(410));
                        resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                        for h in cors_headers() {
                            resp.add_header(h);
                        }
                        let _ = request.respond(resp);
                    }
                }
                continue;
            }

            // 4. Crear secreto efímero POST /api/shares
            if path_only == "/api/shares" && request.method() == &Method::Post {
                let mut body_str = String::new();
                if let Ok(_) = request.as_reader().read_to_string(&mut body_str) {
                    if let Ok(parsed) = serde_json::from_str::<PostShareBody>(&body_str) {
                        let cipher_bytes = b64_decode(&parsed.ciphertext).unwrap_or_default();
                        let nonce_bytes = hex::decode(&parsed.nonce).unwrap_or_default();
                        let ttl = parsed.ttl_minutes.unwrap_or(60);

                        share_store.insert_raw_share(
                            parsed.share_id.clone(),
                            cipher_bytes,
                            nonce_bytes,
                            ttl,
                        );

                        let resp_json = serde_json::json!({
                            "success": true,
                            "shareId": parsed.share_id
                        });
                        let mut resp = Response::from_string(resp_json.to_string())
                            .with_status_code(StatusCode(200));
                        resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                        for h in cors_headers() {
                            resp.add_header(h);
                        }
                        let _ = request.respond(resp);
                        continue;
                    }
                }

                let mut resp = Response::from_string(r#"{"error":"Datos de solicitud inválidos"}"#)
                    .with_status_code(StatusCode(400));
                resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
                for h in cors_headers() {
                    resp.add_header(h);
                }
                let _ = request.respond(resp);
                continue;
            }

            // 5. Servir el visor web HTML autónomo para la raíz o cualquier subruta de /share
            if path_only == "/" || path_only.starts_with("/share") || path_only == "/index.html" {
                let mut resp = Response::from_string(EMBEDDED_HTML)
                    .with_status_code(StatusCode(200));
                resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap());
                for h in cors_headers() {
                    resp.add_header(h);
                }
                let _ = request.respond(resp);
                continue;
            }

            // 6. 404 para cualquier otra ruta
            let mut resp = Response::from_string(r#"{"error":"Ruta no encontrada"}"#)
                .with_status_code(StatusCode(404));
            resp.add_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
            let _ = request.respond(resp);
        }
    });
}
