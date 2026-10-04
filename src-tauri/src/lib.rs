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

    migrate_legacy_app_data_from(&config_root)
}

fn migrate_legacy_app_data_from(config_root: &Path) -> io::Result<()> {
    let legacy_database = config_root.join("com.naide.naicitas").join("nai-citas.db");
    let agendivo_directory = config_root.join("com.naide.agendivo");
    let agendivo_database = agendivo_directory.join("agendivo.db");
    let migration_marker = agendivo_directory.join(".legacy-database-migration-complete");

    if agendivo_database.exists() {
        if legacy_database.exists() && !migration_marker.exists() {
            std::fs::write(migration_marker, b"")?;
        }
        return Ok(());
    }

    if !legacy_database.exists() || migration_marker.exists() {
        return Ok(());
    }

    std::fs::create_dir_all(&agendivo_directory)?;
    std::fs::copy(&legacy_database, &agendivo_database)?;
    copy_sqlite_sidecar(&legacy_database, &agendivo_database, "-wal")?;
    copy_sqlite_sidecar(&legacy_database, &agendivo_database, "-shm")?;
    std::fs::write(migration_marker, b"")?;
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

#[cfg(test)]
mod tests {
    use super::migrate_legacy_app_data_from;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn legacy_database_is_migrated_only_once() {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("el reloj del sistema debe ser válido")
            .as_nanos();
        let config_root = std::env::temp_dir().join(format!(
            "agendivo-legacy-migration-{}-{unique_suffix}",
            std::process::id()
        ));
        let legacy_directory = config_root.join("com.naide.naicitas");
        let legacy_database = legacy_directory.join("nai-citas.db");
        let agendivo_database = config_root
            .join("com.naide.agendivo")
            .join("agendivo.db");

        std::fs::create_dir_all(&legacy_directory).expect("debe crear el directorio temporal");
        std::fs::write(&legacy_database, b"legacy").expect("debe crear la base heredada");

        migrate_legacy_app_data_from(&config_root).expect("debe completar la migración inicial");
        assert_eq!(
            std::fs::read(&agendivo_database).expect("debe crear la base de Agendivo"),
            b"legacy"
        );

        std::fs::remove_file(&agendivo_database).expect("debe simular el reinicio de SQLite");
        migrate_legacy_app_data_from(&config_root)
            .expect("debe respetar la migración completada");
        assert!(!agendivo_database.exists());

        std::fs::remove_dir_all(config_root).expect("debe limpiar el directorio temporal");
    }
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
