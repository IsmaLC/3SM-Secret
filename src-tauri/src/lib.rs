pub mod models;
pub mod crypto;
pub mod storage;
pub mod clipboard;
pub mod generator;
pub mod state;
pub mod commands;
pub mod share;

use state::AppSessionState;
use share::ShareStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppSessionState::new();
    let share_store = ShareStore::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(app_state)
        .manage(share_store)
        .invoke_handler(tauri::generate_handler![
            commands::vault_exists,
            commands::setup_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::get_vault_payload,
            commands::save_vault_item,
            commands::delete_vault_item,
            commands::save_settings,
            commands::copy_to_clipboard_timed,
            commands::generate_secure_password,
            commands::check_auto_lock,
            commands::touch_activity,
            commands::save_folders,
            commands::create_secure_share,
            commands::consume_secure_share,
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación 3SM Secret");
}
