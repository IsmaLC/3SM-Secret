use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::crypto::{self, DerivedKey};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharePayload {
    pub title: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub notes: Option<String>,
    pub cardholder_name: Option<String>,
    pub card_number: Option<String>,
    pub card_cvv: Option<String>,
    pub card_exp: Option<String>,
}

#[derive(Debug, Clone)]
pub struct EphemeralShare {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub created_at: Instant,
    pub ttl: Duration,
    pub consumed: bool,
}

#[derive(Clone)]
pub struct ShareStore {
    pub shares: Arc<Mutex<HashMap<String, EphemeralShare>>>,
}

impl ShareStore {
    pub fn new() -> Self {
        Self {
            shares: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_share(
        &self,
        payload: &SharePayload,
        ttl_minutes: u64,
    ) -> Result<(String, String), String> {
        let plaintext = serde_json::to_vec(payload)
            .map_err(|e| format!("Error serializando payload para compartir: {}", e))?;

        // Generar clave efímera AES-256 criptográficamente segura (Zero-Knowledge)
        let mut key_bytes = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut key_bytes);
        let key = DerivedKey(key_bytes);

        // Generar nonce de 12 bytes
        let nonce = crypto::generate_nonce();

        // Cifrar con AES-256-GCM
        let ciphertext = crypto::encrypt_aes_gcm(&key, &nonce, &plaintext)?;

        let share_id = Uuid::new_v4().to_string();

        let ephemeral = EphemeralShare {
            ciphertext,
            nonce: nonce.to_vec(),
            created_at: Instant::now(),
            ttl: Duration::from_secs(ttl_minutes * 60),
            consumed: false,
        };

        {
            let mut guard = self.shares.lock().await;
            // Limpieza previa de expirados
            guard.retain(|_, v| !v.consumed && v.created_at.elapsed() < v.ttl);
            guard.insert(share_id.clone(), ephemeral);
        }

        let key_base64 = hex::encode(key_bytes);
        Ok((share_id, key_base64))
    }

    pub async fn consume_share(
        &self,
        share_id: &str,
    ) -> Result<(Vec<u8>, Vec<u8>), String> {
        let mut guard = self.shares.lock().await;
        
        let share = guard.get_mut(share_id)
            .ok_or_else(|| "Este enlace de un solo uso no existe o ya ha sido consumido.".to_string())?;

        if share.consumed {
            return Err("Este enlace de un solo uso ya ha sido consumido y destruido permanentemente.".to_string());
        }

        if share.created_at.elapsed() >= share.ttl {
            guard.remove(share_id);
            return Err("Este enlace seguro ha caducado.".to_string());
        }

        // Marcar como consumido inmediatamente (Burn-After-Reading)
        share.consumed = true;
        let ciphertext = share.ciphertext.clone();
        let nonce = share.nonce.clone();

        // Eliminar del mapa
        guard.remove(share_id);

        Ok((ciphertext, nonce))
    }
}
