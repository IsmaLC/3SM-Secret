use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::RngCore;
use zeroize::{Zeroize, ZeroizeOnDrop};

pub const SALT_LEN: usize = 16;
pub const NONCE_LEN: usize = 12;
pub const KEY_LEN: usize = 32;

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct DerivedKey(pub [u8; KEY_LEN]);

impl DerivedKey {
    pub fn as_slice(&self) -> &[u8] {
        &self.0
    }
}

pub fn generate_salt() -> [u8; SALT_LEN] {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    salt
}

pub fn generate_nonce() -> [u8; NONCE_LEN] {
    let mut nonce = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce);
    nonce
}

pub fn derive_key(password: &str, salt: &[u8]) -> Result<DerivedKey, String> {
    let params = Params::new(64 * 1024, 3, 4, Some(KEY_LEN))
        .map_err(|e| format!("Error en parámetros Argon2: {}", e))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut key_bytes = [0u8; KEY_LEN];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key_bytes)
        .map_err(|e| format!("Error en derivación de clave Argon2id: {}", e))?;

    Ok(DerivedKey(key_bytes))
}

pub fn encrypt_aes_gcm(key: &DerivedKey, nonce_bytes: &[u8], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key.as_slice())
        .map_err(|e| format!("Error al inicializar AES-GCM: {}", e))?;
    
    let nonce = Nonce::from_slice(nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Error al cifrar datos con AES-256-GCM: {}", e))?;

    Ok(ciphertext)
}

pub fn decrypt_aes_gcm(key: &DerivedKey, nonce_bytes: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key.as_slice())
        .map_err(|e| format!("Error al inicializar AES-GCM: {}", e))?;

    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Contraseña maestra incorrecta o datos manipulados (error de autenticación GCM)".to_string())?;

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_argon2_and_aes_gcm_cycle() {
        let password = "SuperSecretMasterPassword#2026!";
        let salt = generate_salt();
        let key = derive_key(password, &salt).expect("Fallo al derivar clave");

        let original_data = b"Contenido confidencial de prueba del baul 3SM Secret";
        let nonce = generate_nonce();

        // Cifrado
        let ciphertext = encrypt_aes_gcm(&key, &nonce, original_data)
            .expect("Fallo al cifrar");
        assert_ne!(ciphertext, original_data);

        // Descifrado correcto
        let decrypted = decrypt_aes_gcm(&key, &nonce, &ciphertext)
            .expect("Fallo al descifrar");
        assert_eq!(decrypted, original_data);

        // Clave errónea debe fallar en la autenticación GCM
        let wrong_key = derive_key("ContraseñaIncorrecta", &salt).expect("Derivación");
        let result = decrypt_aes_gcm(&wrong_key, &nonce, &ciphertext);
        assert!(result.is_err(), "Descifrado con clave incorrecta debería fallar");
    }

    #[test]
    fn test_tamper_resistance() {
        let password = "TamperProofTestPassword";
        let salt = generate_salt();
        let key = derive_key(password, &salt).unwrap();
        let nonce = generate_nonce();
        let original_data = b"Datos autenticados contra manipulacion";

        let mut ciphertext = encrypt_aes_gcm(&key, &nonce, original_data).unwrap();
        // Manipular un byte del ciphertext
        ciphertext[0] ^= 0xFF;

        let result = decrypt_aes_gcm(&key, &nonce, &ciphertext);
        assert!(result.is_err(), "Criptografía GCM debe rechazar payloads manipulados");
    }
}
