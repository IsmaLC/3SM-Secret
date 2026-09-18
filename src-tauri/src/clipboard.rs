use std::time::Duration;
use arboard::Clipboard;

pub fn copy_and_schedule_clear(text: String, timeout_secs: u64) -> Result<(), String> {
    // 1. Copiar al portapapeles de forma nativa
    {
        let mut clipboard = Clipboard::new()
            .map_err(|e| format!("Error accediendo al portapapeles nativo: {}", e))?;
        clipboard.set_text(&text)
            .map_err(|e| format!("Error guardando en portapapeles: {}", e))?;
    }

    // 2. Programar hilo de limpieza si el texto no ha sido reemplazado por otro valor
    let text_to_clear = text;
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(timeout_secs)).await;
        
        // Verificamos si el contenido actual sigue siendo exactamente el texto que copiamos
        if let Ok(mut cb) = Clipboard::new() {
            if let Ok(current_text) = cb.get_text() {
                if current_text == text_to_clear {
                    let _ = cb.clear();
                }
            }
        }
    });

    Ok(())
}
