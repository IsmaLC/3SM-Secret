use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use directories::ProjectDirs;
use crate::models::EncryptedEnvelope;

pub fn get_vault_path() -> Result<PathBuf, String> {
    let proj_dirs = ProjectDirs::from("com", "tresmsecret", "vault")
        .ok_or_else(|| "No se pudo determinar el directorio de datos del usuario".to_string())?;
    
    let dir = proj_dirs.data_dir();
    fs::create_dir_all(dir).map_err(|e| format!("Error al crear directorio de datos: {}", e))?;
    
    Ok(dir.join("vault.enc"))
}

pub fn vault_file_exists() -> bool {
    if let Ok(path) = get_vault_path() {
        path.exists()
    } else {
        false
    }
}

pub fn save_encrypted_envelope(envelope: &EncryptedEnvelope) -> Result<(), String> {
    let path = get_vault_path()?;
    let json = serde_json::to_string_pretty(envelope)
        .map_err(|e| format!("Error serializando envelope: {}", e))?;
    
    // Escritura atómica mediante archivo temporal
    let temp_path = path.with_extension("tmp");
    {
        let mut file = File::create(&temp_path)
            .map_err(|e| format!("Error creando archivo temporal: {}", e))?;
        file.write_all(json.as_bytes())
            .map_err(|e| format!("Error escribiendo baúl temporal: {}", e))?;
        file.flush()
            .map_err(|e| format!("Error vaciando buffer a disco: {}", e))?;
    }
    
    fs::rename(&temp_path, &path)
        .map_err(|e| format!("Error reemplazando archivo de baúl: {}", e))?;
    
    Ok(())
}

pub fn read_encrypted_envelope() -> Result<EncryptedEnvelope, String> {
    let path = get_vault_path()?;
    if !path.exists() {
        return Err("El archivo de baúl no existe".to_string());
    }
    
    let mut file = File::open(&path)
        .map_err(|e| format!("Error abriendo baúl cifrado: {}", e))?;
    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|e| format!("Error leyendo baúl cifrado: {}", e))?;
    
    let envelope: EncryptedEnvelope = serde_json::from_str(&content)
        .map_err(|e| format!("Formato de baúl corrupto o inválido: {}", e))?;
    
    Ok(envelope)
}
