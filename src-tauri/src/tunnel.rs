use std::sync::{Arc, RwLock, Mutex};
use std::process::{Command, Child, Stdio};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

fn find_cloudflared() -> Option<PathBuf> {
    // 1. Comprobar binario local en node_modules o ../node_modules
    for rel_path in [
        "node_modules/cloudflared/bin/cloudflared",
        "../node_modules/cloudflared/bin/cloudflared",
    ] {
        let p = Path::new(rel_path);
        if p.exists() {
            return Some(p.to_path_buf());
        }
    }

    // 2. Comprobar junto al ejecutable de la aplicación
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let relative_bin = exe_dir.join("cloudflared");
            if relative_bin.exists() {
                return Some(relative_bin);
            }
        }
    }

    // 3. Comprobar en PATH mediante 'which'
    if let Ok(output) = Command::new("which").arg("cloudflared").output() {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path_str.is_empty() {
                return Some(PathBuf::from(path_str));
            }
        }
    }

    // 4. Rutas comunes en macOS y Linux
    for candidate in [
        "/opt/homebrew/bin/cloudflared",
        "/usr/local/bin/cloudflared",
        "/usr/bin/cloudflared",
    ] {
        let p = Path::new(candidate);
        if p.exists() {
            return Some(p.to_path_buf());
        }
    }

    None
}

#[derive(Clone)]
pub struct TunnelManager {
    pub url: Arc<RwLock<Option<String>>>,
    pub is_connecting: Arc<RwLock<bool>>,
    pub child: Arc<Mutex<Option<Child>>>,
}

impl TunnelManager {
    pub fn new() -> Self {
        Self {
            url: Arc::new(RwLock::new(None)),
            is_connecting: Arc::new(RwLock::new(false)),
            child: Arc::new(Mutex::new(None)),
        }
    }

    pub fn get_url(&self) -> Option<String> {
        self.url.read().unwrap().clone()
    }

    pub fn is_ready(&self) -> bool {
        self.url.read().unwrap().is_some()
    }

    pub fn is_connecting(&self) -> bool {
        *self.is_connecting.read().unwrap()
    }

    pub fn start_tunnel(&self, target_port: u16) {
        if self.is_ready() || self.is_connecting() {
            return;
        }

        let url_arc = Arc::clone(&self.url);
        let connecting_arc = Arc::clone(&self.is_connecting);
        let child_arc = Arc::clone(&self.child);

        *connecting_arc.write().unwrap() = true;

        std::thread::spawn(move || {
            let binary = find_cloudflared();
            let mut cmd = if let Some(bin_path) = binary {
                let mut c = Command::new(bin_path);
                c.args(["tunnel", "--url", &format!("http://127.0.0.1:{}", target_port)]);
                c
            } else {
                // Fallback a npx
                let mut c = Command::new("npx");
                c.args(["-y", "cloudflared", "tunnel", "--url", &format!("http://127.0.0.1:{}", target_port)]);
                c
            };

            cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

            let mut child = match cmd.spawn() {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("[3SM Secret] Error iniciando cloudflared: {}", e);
                    *connecting_arc.write().unwrap() = false;
                    return;
                }
            };

            // Monitorizar stderr
            if let Some(stderr) = child.stderr.take() {
                let url_clone = Arc::clone(&url_arc);
                let connecting_clone = Arc::clone(&connecting_arc);
                std::thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line_res in reader.lines() {
                        if let Ok(line) = line_res {
                            if let Some(start) = line.find("https://") {
                                let sub = &line[start..];
                                if let Some(end) = sub.find(".trycloudflare.com") {
                                    let full_url = &sub[..end + 18];
                                    let clean_url = full_url.trim().to_string();
                                    println!("\n[3SM Secret] 🌐 Túnel Cloudflare público activo: {}", clean_url);
                                    *url_clone.write().unwrap() = Some(clean_url);
                                    *connecting_clone.write().unwrap() = false;
                                }
                            }
                        }
                    }
                });
            }

            // Monitorizar stdout
            if let Some(stdout) = child.stdout.take() {
                let url_clone = Arc::clone(&url_arc);
                let connecting_clone = Arc::clone(&connecting_arc);
                std::thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line_res in reader.lines() {
                        if let Ok(line) = line_res {
                            if let Some(start) = line.find("https://") {
                                let sub = &line[start..];
                                if let Some(end) = sub.find(".trycloudflare.com") {
                                    let full_url = &sub[..end + 18];
                                    let clean_url = full_url.trim().to_string();
                                    println!("\n[3SM Secret] 🌐 Túnel Cloudflare público activo: {}", clean_url);
                                    *url_clone.write().unwrap() = Some(clean_url);
                                    *connecting_clone.write().unwrap() = false;
                                }
                            }
                        }
                    }
                });
            }

            *child_arc.lock().unwrap() = Some(child);
        });
    }

    pub fn stop_tunnel(&self) {
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
        }
        *self.url.write().unwrap() = None;
        *self.is_connecting.write().unwrap() = false;
    }
}
