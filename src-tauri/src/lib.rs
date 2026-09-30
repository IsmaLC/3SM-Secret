pub mod models;
pub mod crypto;
pub mod storage;
pub mod clipboard;
pub mod generator;
pub mod state;
pub mod commands;
pub mod share;
pub mod tunnel;
pub mod share_server;

use state::AppSessionState;
use share::ShareStore;
use tunnel::TunnelManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppSessionState::new();
    let share_store = ShareStore::new();
    let tunnel_manager = TunnelManager::new();

    // Iniciar servidor HTTP nativo en segundo plano para compartir secretos
    share_server::start_native_share_server(1422, share_store.clone(), tunnel_manager.clone());

    // Iniciar túnel de Cloudflare hacia el puerto local 1422
    tunnel_manager.start_tunnel(1422);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(app_state)
        .manage(share_store)
        .manage(tunnel_manager)
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
            commands::get_cloudflare_tunnel_status,
            commands::start_cloudflare_tunnel,
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación 3SM Secret");
}
