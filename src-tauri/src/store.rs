//! Local persistence for everything the reader creates: notes, highlights,
//! bookmarks, reading position, plan progress and preferences.
//!
//! One JSON document, written atomically. Small enough to keep in memory, so
//! saving is a single fsync-free rename and never blocks the UI thread.

use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("mkdir {}: {e}", dir.display()))?;
    Ok(dir)
}

pub fn load_state(app: &AppHandle) -> String {
    let Ok(dir) = data_dir(app) else {
        return "{}".to_string();
    };
    fs::read_to_string(dir.join("state.json")).unwrap_or_else(|_| "{}".to_string())
}

pub fn save_state(app: &AppHandle, json: String) -> Result<(), String> {
    let dir = data_dir(app)?;
    write_atomic(&dir.join("state.json"), json.as_bytes())
}

pub fn write_atomic(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, bytes).map_err(|e| format!("write {}: {e}", tmp.display()))?;
    fs::rename(&tmp, path).map_err(|e| format!("rename {}: {e}", path.display()))?;
    Ok(())
}
