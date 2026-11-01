mod bible;
mod feed;
mod store;

use bible::{Bible, CrossRef, Hit, Meta, SearchPage, Xrefs};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

struct AppState {
    bible: Bible,
    xrefs: Xrefs,
}

fn resource_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(dir) = app.path().resource_dir() {
        candidates.push(dir.join("resources").join(name));
        candidates.push(dir.join(name));
    }
    candidates.push(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join(name),
    );
    candidates
        .into_iter()
        .find(|p| p.exists())
        .ok_or_else(|| format!("umutungo '{name}' ntabwo wabonetse"))
}

/* --------------------------------------------------------------- reading ---- */

#[tauri::command]
fn bible_meta(state: State<'_, AppState>) -> Meta {
    state.bible.meta.clone()
}

#[tauri::command]
fn bible_chapter(state: State<'_, AppState>, book: usize, chapter: usize) -> Vec<String> {
    state.bible.chapter(book, chapter)
}

#[tauri::command]
fn bible_passage(
    state: State<'_, AppState>,
    book: usize,
    chapter: usize,
    from: usize,
    to: usize,
) -> Vec<Hit> {
    state.bible.passage(book, chapter, from, to)
}

#[tauri::command]
fn bible_search(
    state: State<'_, AppState>,
    query: String,
    scope: Option<String>,
    offset: usize,
    limit: usize,
) -> SearchPage {
    state
        .bible
        .search(&query, scope.as_deref(), offset, limit.min(500))
}

#[tauri::command]
fn bible_xrefs(
    state: State<'_, AppState>,
    book: usize,
    chapter: usize,
    verse: usize,
) -> Vec<CrossRef> {
    state.xrefs.for_verse(&state.bible, book, chapter, verse)
}

/* ----------------------------------------------------------------- state ---- */

#[tauri::command]
fn state_load(app: AppHandle) -> String {
    store::load_state(&app)
}

#[tauri::command]
fn state_save(app: AppHandle, json: String) -> Result<(), String> {
    store::save_state(&app, json)
}

/// Write a portable backup (all notes, highlights, bookmarks, plans) to a file
/// the user picked. Returns the path so the UI can confirm it.
#[tauri::command]
fn backup_export(app: AppHandle, path: String) -> Result<String, String> {
    let json = store::load_state(&app);
    std::fs::write(&path, json.as_bytes()).map_err(|e| format!("ntibyashobotse kwandika: {e}"))?;
    Ok(path)
}

/// Restore a backup. The file must be a JSON object; it is merged into the
/// current state so a partial backup can never wipe newer data.
#[tauri::command]
fn backup_import(app: AppHandle, path: String) -> Result<String, String> {
    let raw = std::fs::read_to_string(&path).map_err(|e| format!("ntibyashobotse gusoma: {e}"))?;
    let value: serde_json::Value =
        serde_json::from_str(&raw).map_err(|_| "iyi dosiye ntabwo ari backup yuzuye".to_string())?;
    if !value.is_object() {
        return Err("iyi dosiye ntabwo ari backup yuzuye".into());
    }
    store::save_state(&app, raw.clone())?;
    Ok(raw)
}

/* ------------------------------------------------------------------ feed ---- */

#[tauri::command]
fn feed_check(url: String) -> Result<feed::Manifest, String> {
    feed::check(&url)
}

#[tauri::command]
fn feed_install(app: AppHandle, url: String, pack_id: String) -> Result<feed::InstalledPack, String> {
    feed::install(&app, &url, &pack_id)
}

#[tauri::command]
fn feed_installed(app: AppHandle) -> Vec<feed::InstalledPack> {
    feed::installed(&app)
}

#[tauri::command]
fn feed_uninstall(app: AppHandle, pack_id: String) -> Result<(), String> {
    feed::uninstall(&app, &pack_id)
}

#[tauri::command]
fn feed_default_url(app: AppHandle) -> String {
    feed::default_url(&app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle();
            let bible_bin = resource_path(handle, "bible.bin")?;
            let xref_bin = resource_path(handle, "xref.bin")?;
            let bible = Bible::load(&bible_bin)?;
            let xrefs = Xrefs::load(&xref_bin)?;
            println!(
                "Bibiliya Yera: {} ibice, {} imirongo ({} B) | cross-refs ok",
                bible.meta.total_chapters,
                bible.meta.total_verses,
                std::fs::metadata(&bible_bin).map(|m| m.len()).unwrap_or(0)
            );
            app.manage(AppState { bible, xrefs });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bible_meta,
            bible_chapter,
            bible_passage,
            bible_search,
            bible_xrefs,
            state_load,
            state_save,
            backup_export,
            backup_import,
            feed_check,
            feed_install,
            feed_installed,
            feed_uninstall,
            feed_default_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Bibiliya Yera");
}
