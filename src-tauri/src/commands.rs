use std::time::Instant;
use tauri::State;
use chrono::Utc;
use uuid::Uuid;

use crate::crypto;
use crate::models::{
    EncryptedEnvelope, Folder, ItemTypeSerdeWrapper, PasswordGenOptions, PasswordGenResult,
    VaultItem, VaultPayload, VaultSettings,
};
use crate::state::{AppSessionState, UnlockedVaultSession};
use crate::storage;
use crate::clipboard;
use crate::generator;

#[tauri::command]
pub async fn vault_exists() -> Result<bool, String> {
    Ok(storage::vault_file_exists())
}

#[tauri::command]
pub async fn setup_vault(
    master_password: String,
    hint: Option<String>,
    language: Option<String>,
    app_state: State<'_, AppSessionState>,
) -> Result<VaultPayload, String> {
    if master_password.trim().len() < 8 {
        return Err("La contraseña maestra debe tener al menos 8 caracteres".to_string());
    }

    let salt = crypto::generate_salt();
    let key = crypto::derive_key(&master_password, &salt)?;

    // Crear elementos iniciales de demostración inspirados en el diseño de Stitch
    let now = Utc::now().to_rfc3339();
    let demo_items = vec![
        VaultItem {
            id: Uuid::new_v4().to_string(),
            name: "Google Workspace".to_string(),
            item_type: ItemTypeSerdeWrapper::Login,
            username: "admin@corporativo.com".to_string(),
            password: "p@ssW0rd_Stitch#2026".to_string(),
            url: "https://accounts.google.com".to_string(),
            notes: "Cuenta de administrador corporativo con llaves de seguridad FIDO2 habilitadas.".to_string(),
            folder_id: None,
            favorite: true,
            totp_secret: Some("JBSWY3DPEHPK3PXP".to_string()),
            cardholder_name: None,
            card_number: None,
            card_brand: None,
            card_exp_month: None,
            card_exp_year: None,
            card_cvv: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        VaultItem {
            id: Uuid::new_v4().to_string(),
            name: "Microsoft 365 Azure".to_string(),
            item_type: ItemTypeSerdeWrapper::Login,
            username: "sec-admin@azurecorp.net".to_string(),
            password: "Azure#Sec_K3y!99".to_string(),
            url: "https://portal.azure.com".to_string(),
            notes: "Suscripción Enterprise de producción y despliegues.".to_string(),
            folder_id: None,
            favorite: true,
            totp_secret: None,
            cardholder_name: None,
            card_number: None,
            card_brand: None,
            card_exp_month: None,
            card_exp_year: None,
            card_cvv: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        VaultItem {
            id: Uuid::new_v4().to_string(),
            name: "GitHub Enterprise".to_string(),
            item_type: ItemTypeSerdeWrapper::Login,
            username: "dev-lead".to_string(),
            password: "ghp_secureTokenMockDev2026!".to_string(),
            url: "https://github.com".to_string(),
            notes: "Token con permisos de administración de repositorios.".to_string(),
            folder_id: None,
            favorite: false,
            totp_secret: None,
            cardholder_name: None,
            card_number: None,
            card_brand: None,
            card_exp_month: None,
            card_exp_year: None,
            card_cvv: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        VaultItem {
            id: Uuid::new_v4().to_string(),
            name: "Tarjeta Visa Corporativa".to_string(),
            item_type: ItemTypeSerdeWrapper::Card,
            username: String::new(),
            password: String::new(),
            url: String::new(),
            notes: "Tarjeta para compras de infraestructura en la nube y licencias de software.".to_string(),
            folder_id: None,
            favorite: true,
            totp_secret: None,
            cardholder_name: Some("ISMAEL LUJAN CASADO".to_string()),
            card_number: Some("4532 8791 2345 9812".to_string()),
            card_brand: Some("Visa".to_string()),
            card_exp_month: Some("09".to_string()),
            card_exp_year: Some("2029".to_string()),
            card_cvv: Some("842".to_string()),
            created_at: now.clone(),
            updated_at: now.clone(),
        },
    ];

    let folders = vec![
        Folder {
            id: Uuid::new_v4().to_string(),
            name: "Trabajo".to_string(),
        },
        Folder {
            id: Uuid::new_v4().to_string(),
            name: "Finanzas".to_string(),
        },
    ];

    let payload = VaultPayload {
        items: demo_items,
        folders,
        settings: VaultSettings {
            auto_lock_minutes: 15,
            language: language.unwrap_or_else(|| "es".to_string()),
            theme: "light".to_string(),
        },
        password_hint: hint.clone(),
    };

    let plaintext = serde_json::to_vec(&payload)
        .map_err(|e| format!("Error serializando payload: {}", e))?;
    
    let nonce = crypto::generate_nonce();
    let ciphertext = crypto::encrypt_aes_gcm(&key, &nonce, &plaintext)?;

    let envelope = EncryptedEnvelope {
        version: 1,
        salt: hex::encode(salt),
        nonce: hex::encode(nonce),
        ciphertext: base64_encode(&ciphertext),
        hint,
    };

    storage::save_encrypted_envelope(&envelope)?;

    let mut guard = app_state.session.lock().await;
    *guard = Some(UnlockedVaultSession {
        key,
        salt,
        payload: payload.clone(),
        last_activity: Instant::now(),
    });

    Ok(payload)
}

#[tauri::command]
pub async fn unlock_vault(
    master_password: String,
    app_state: State<'_, AppSessionState>,
) -> Result<VaultPayload, String> {
    let envelope = storage::read_encrypted_envelope()?;
    
    let salt = hex::decode(&envelope.salt)
        .map_err(|e| format!("Error decodificando salt: {}", e))?;
    let nonce = hex::decode(&envelope.nonce)
        .map_err(|e| format!("Error decodificando nonce: {}", e))?;
    let ciphertext = base64_decode(&envelope.ciphertext)
        .map_err(|e| format!("Error decodificando ciphertext: {}", e))?;

    let key = crypto::derive_key(&master_password, &salt)?;
    let plaintext = crypto::decrypt_aes_gcm(&key, &nonce, &ciphertext)?;

    let payload: VaultPayload = serde_json::from_slice(&plaintext)
        .map_err(|e| format!("Error deserializando contenido del baúl: {}", e))?;

    let mut salt_arr = [0u8; 16];
    salt_arr.copy_from_slice(&salt[..16]);

    let mut guard = app_state.session.lock().await;
    *guard = Some(UnlockedVaultSession {
        key,
        salt: salt_arr,
        payload: payload.clone(),
        last_activity: Instant::now(),
    });

    Ok(payload)
}

#[tauri::command]
pub async fn lock_vault(app_state: State<'_, AppSessionState>) -> Result<(), String> {
    app_state.lock().await;
    Ok(())
}

#[tauri::command]
pub async fn get_vault_payload(app_state: State<'_, AppSessionState>) -> Result<VaultPayload, String> {
    app_state.touch_activity().await;
    let guard = app_state.session.lock().await;
    if let Some(ref session) = *guard {
        Ok(session.payload.clone())
    } else {
        Err("El baúl está bloqueado".to_string())
    }
}

#[tauri::command]
pub async fn save_vault_item(
    mut item: VaultItem,
    app_state: State<'_, AppSessionState>,
) -> Result<VaultItem, String> {
    app_state.touch_activity().await;
    let mut guard = app_state.session.lock().await;
    let session = guard.as_mut().ok_or_else(|| "El baúl está bloqueado".to_string())?;

    let now = Utc::now().to_rfc3339();
    if item.id.is_empty() {
        item.id = Uuid::new_v4().to_string();
        item.created_at = now.clone();
        item.updated_at = now;
        session.payload.items.push(item.clone());
    } else {
        item.updated_at = now;
        if let Some(idx) = session.payload.items.iter().position(|i| i.id == item.id) {
            session.payload.items[idx] = item.clone();
        } else {
            session.payload.items.push(item.clone());
        }
    }

    persist_session_to_disk(session)?;

    Ok(item)
}

#[tauri::command]
pub async fn delete_vault_item(
    id: String,
    app_state: State<'_, AppSessionState>,
) -> Result<(), String> {
    app_state.touch_activity().await;
    let mut guard = app_state.session.lock().await;
    let session = guard.as_mut().ok_or_else(|| "El baúl está bloqueado".to_string())?;

    session.payload.items.retain(|i| i.id != id);

    persist_session_to_disk(session)?;

    Ok(())
}

#[tauri::command]
pub async fn save_settings(
    settings: VaultSettings,
    app_state: State<'_, AppSessionState>,
) -> Result<(), String> {
    app_state.touch_activity().await;
    let mut guard = app_state.session.lock().await;
    let session = guard.as_mut().ok_or_else(|| "El baúl está bloqueado".to_string())?;

    session.payload.settings = settings;

    persist_session_to_disk(session)?;

    Ok(())
}

#[tauri::command]
pub async fn copy_to_clipboard_timed(
    text: String,
    timeout_secs: Option<u64>,
) -> Result<(), String> {
    let secs = timeout_secs.unwrap_or(10);
    clipboard::copy_and_schedule_clear(text, secs)
}

#[tauri::command]
pub async fn generate_secure_password(options: PasswordGenOptions) -> Result<PasswordGenResult, String> {
    Ok(generator::generate_password_with_options(&options))
}

#[tauri::command]
pub async fn check_auto_lock(app_state: State<'_, AppSessionState>) -> Result<bool, String> {
    Ok(app_state.check_auto_lock().await)
}

#[tauri::command]
pub async fn touch_activity(app_state: State<'_, AppSessionState>) -> Result<(), String> {
    app_state.touch_activity().await;
    Ok(())
}

#[tauri::command]
pub async fn save_folders(
    folders: Vec<crate::models::Folder>,
    app_state: State<'_, AppSessionState>,
) -> Result<Vec<crate::models::Folder>, String> {
    app_state.touch_activity().await;
    let mut guard = app_state.session.lock().await;
    let session = guard.as_mut().ok_or_else(|| "El baúl está bloqueado".to_string())?;

    session.payload.folders = folders.clone();
    persist_session_to_disk(session)?;

    Ok(folders)
}

#[tauri::command]
pub async fn create_secure_share(
    payload: crate::share::SharePayload,
    ttl_minutes: Option<u64>,
    share_store: State<'_, crate::share::ShareStore>,
) -> Result<(String, String), String> {
    let ttl = ttl_minutes.unwrap_or(60);
    share_store.create_share(&payload, ttl).await
}

#[derive(serde::Serialize)]
pub struct ConsumedShareResponse {
    pub ciphertext: String,
    pub nonce: String,
}

#[tauri::command]
pub async fn consume_secure_share(
    share_id: String,
    share_store: State<'_, crate::share::ShareStore>,
) -> Result<ConsumedShareResponse, String> {
    let (ciphertext, nonce) = share_store.consume_share(&share_id).await?;
    Ok(ConsumedShareResponse {
        ciphertext: base64_encode(&ciphertext),
        nonce: hex::encode(nonce),
    })
}

fn persist_session_to_disk(session: &UnlockedVaultSession) -> Result<(), String> {
    let plaintext = serde_json::to_vec(&session.payload)
        .map_err(|e| format!("Error serializando payload: {}", e))?;
    
    let nonce = crypto::generate_nonce();
    let ciphertext = crypto::encrypt_aes_gcm(&session.key, &nonce, &plaintext)?;

    let envelope = EncryptedEnvelope {
        version: 1,
        salt: hex::encode(session.salt),
        nonce: hex::encode(nonce),
        ciphertext: base64_encode(&ciphertext),
        hint: session.payload.password_hint.clone(),
    };

    storage::save_encrypted_envelope(&envelope)
}

fn base64_encode(data: &[u8]) -> String {
    let mut buf = Vec::new();
    {
        let mut encoder = Base64Encoder::new(&mut buf);
        for byte in data {
            encoder.write_byte(*byte);
        }
        encoder.flush();
    }
    String::from_utf8(buf).unwrap_or_default()
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    let clean: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    let bytes = clean.as_bytes();
    if bytes.len() % 4 != 0 {
        return Err("Longitud base64 inválida".to_string());
    }

    let mut out = Vec::with_capacity(bytes.len() * 3 / 4);
    let mut i = 0;
    while i < bytes.len() {
        let b0 = decode_b64_char(bytes[i])?;
        let b1 = decode_b64_char(bytes[i + 1])?;
        let b2 = if bytes[i + 2] == b'=' { 0 } else { decode_b64_char(bytes[i + 2])? };
        let b3 = if bytes[i + 3] == b'=' { 0 } else { decode_b64_char(bytes[i + 3])? };

        let triple = ((b0 as u32) << 18) | ((b1 as u32) << 12) | ((b2 as u32) << 6) | (b3 as u32);
        out.push(((triple >> 16) & 0xFF) as u8);
        if bytes[i + 2] != b'=' {
            out.push(((triple >> 8) & 0xFF) as u8);
        }
        if bytes[i + 3] != b'=' {
            out.push((triple & 0xFF) as u8);
        }
        i += 4;
    }
    Ok(out)
}

const B64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

struct Base64Encoder<'a> {
    target: &'a mut Vec<u8>,
    buffer: [u8; 3],
    count: usize,
}

impl<'a> Base64Encoder<'a> {
    fn new(target: &'a mut Vec<u8>) -> Self {
        Self { target, buffer: [0; 3], count: 0 }
    }

    fn write_byte(&mut self, b: u8) {
        self.buffer[self.count] = b;
        self.count += 1;
        if self.count == 3 {
            self.encode_chunk();
            self.count = 0;
        }
    }

    fn encode_chunk(&mut self) {
        let b0 = self.buffer[0];
        let b1 = self.buffer[1];
        let b2 = self.buffer[2];
        let triple = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);
        self.target.push(B64_ALPHABET[((triple >> 18) & 0x3F) as usize]);
        self.target.push(B64_ALPHABET[((triple >> 12) & 0x3F) as usize]);
        self.target.push(B64_ALPHABET[((triple >> 6) & 0x3F) as usize]);
        self.target.push(B64_ALPHABET[(triple & 0x3F) as usize]);
    }

    fn flush(&mut self) {
        if self.count == 0 { return; }
        if self.count == 1 {
            let b0 = self.buffer[0];
            let triple = (b0 as u32) << 16;
            self.target.push(B64_ALPHABET[((triple >> 18) & 0x3F) as usize]);
            self.target.push(B64_ALPHABET[((triple >> 12) & 0x3F) as usize]);
            self.target.push(b'=');
            self.target.push(b'=');
        } else if self.count == 2 {
            let b0 = self.buffer[0];
            let b1 = self.buffer[1];
            let triple = ((b0 as u32) << 16) | ((b1 as u32) << 8);
            self.target.push(B64_ALPHABET[((triple >> 18) & 0x3F) as usize]);
            self.target.push(B64_ALPHABET[((triple >> 12) & 0x3F) as usize]);
            self.target.push(B64_ALPHABET[((triple >> 6) & 0x3F) as usize]);
            self.target.push(b'=');
        }
    }
}

fn decode_b64_char(c: u8) -> Result<u8, String> {
    match c {
        b'A'..=b'Z' => Ok(c - b'A'),
        b'a'..=b'z' => Ok(c - b'a' + 26),
        b'0'..=b'9' => Ok(c - b'0' + 52),
        b'+' => Ok(62),
        b'/' => Ok(63),
        _ => Err(format!("Carácter base64 no válido: {}", c as char)),
    }
}
