mod migrations;

use std::io;
use std::path::{Path, PathBuf};

#[cfg(desktop)]
use tauri::Manager;
#[cfg(any(target_os = "linux", target_os = "windows"))]
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    migrate_legacy_app_data().expect("no se pudieron migrar los datos locales a Agendivo");

    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(migrations::DATABASE_URL, migrations::migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(any(target_os = "linux", target_os = "windows"))]
            app.deep_link().register("agendivo")?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar la aplicación");
}

fn migrate_legacy_app_data() -> io::Result<()> {
    let Some(config_root) = config_root() else {
        return Ok(());
    };
    let legacy_database = config_root.join("com.naide.naicitas").join("nai-citas.db");
    let agendivo_directory = config_root.join("com.naide.agendivo");
    let agendivo_database = agendivo_directory.join("agendivo.db");

    if !legacy_database.exists() || agendivo_database.exists() {
        return Ok(());
    }

    std::fs::create_dir_all(&agendivo_directory)?;
    std::fs::copy(&legacy_database, &agendivo_database)?;
    copy_sqlite_sidecar(&legacy_database, &agendivo_database, "-wal")?;
    copy_sqlite_sidecar(&legacy_database, &agendivo_database, "-shm")?;
    Ok(())
}

fn copy_sqlite_sidecar(source: &Path, destination: &Path, suffix: &str) -> io::Result<()> {
    let source_sidecar = PathBuf::from(format!("{}{}", source.display(), suffix));
    if source_sidecar.exists() {
        let destination_sidecar = PathBuf::from(format!("{}{}", destination.display(), suffix));
        std::fs::copy(source_sidecar, destination_sidecar)?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn config_root() -> Option<PathBuf> {
    std::env::var_os("APPDATA").map(PathBuf::from)
}

#[cfg(target_os = "macos")]
fn config_root() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .map(|home| home.join("Library").join("Application Support"))
}

#[cfg(target_os = "linux")]
fn config_root() -> Option<PathBuf> {
    std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var_os("HOME")
                .map(PathBuf::from)
                .map(|home| home.join(".config"))
        })
}
