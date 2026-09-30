use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
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

    pub fn insert_raw_share(
        &self,
        share_id: String,
        ciphertext: Vec<u8>,
        nonce: Vec<u8>,
        ttl_minutes: u64,
    ) {
        let ephemeral = EphemeralShare {
            ciphertext,
            nonce,
            created_at: Instant::now(),
            ttl: Duration::from_secs(ttl_minutes * 60),
            consumed: false,
        };

        let mut guard = self.shares.lock().unwrap();
        guard.retain(|_, v| !v.consumed && v.created_at.elapsed() < v.ttl);
        guard.insert(share_id, ephemeral);
    }

    pub fn create_share(
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

        let share_id = format!("sec-{}", Uuid::new_v4());

        self.insert_raw_share(share_id.clone(), ciphertext, nonce.to_vec(), ttl_minutes);

        let key_hex = hex::encode(key_bytes);
        Ok((share_id, key_hex))
    }

    pub fn consume_share(
        &self,
        share_id: &str,
    ) -> Result<(Vec<u8>, Vec<u8>), String> {
        let mut guard = self.shares.lock().unwrap();
        
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

