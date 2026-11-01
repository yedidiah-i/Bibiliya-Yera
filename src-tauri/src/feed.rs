//! Online content feed.
//!
//! The app is fully offline by default. When the publisher hosts a
//! `manifest.json` somewhere (GitHub Pages, S3, any HTTPS host), the reader can
//! pull new devotionals, reading plans or study notes without reinstalling.
//! Downloads are content-addressed (sha256) and stored per pack, so a failed or
//! interrupted update can never corrupt the Bible itself.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Manager};

const MAX_PACK_BYTES: u64 = 24 * 1024 * 1024;
const USER_AGENT: &str = "BibiliyaYera/1.0 (+offline bible for Windows)";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pack {
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(rename = "type", default)]
    pub kind: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default)]
    pub sha256: String,
    pub url: String,
    #[serde(default)]
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    #[serde(default)]
    pub version: u32,
    #[serde(default)]
    pub updated: String,
    #[serde(default)]
    pub message: String,
    #[serde(default)]
    pub packs: Vec<Pack>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledMeta {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub version: String,
    pub installed_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct InstalledPack {
    pub meta: InstalledMeta,
    pub content: serde_json::Value,
}

fn fetch(url: &str) -> Result<Vec<u8>, String> {
    let resp = ureq::get(url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/json, text/plain, */*")
        .timeout(Duration::from_secs(30))
        .call()
        .map_err(|e| format!("ntibyakunze kugera kuri seriveri: {e}"))?;
    let mut buf = Vec::new();
    resp.into_reader()
        .take(MAX_PACK_BYTES)
        .read_to_end(&mut buf)
        .map_err(|e| format!("gusoma amakuru: {e}"))?;
    if buf.is_empty() {
        return Err("seriveri yatanze amakuru ubusa".into());
    }
    Ok(buf)
}

fn resolve(base: &str, url: &str) -> String {
    if url.starts_with("http://") || url.starts_with("https://") {
        return url.to_string();
    }
    // Resolve against the manifest location, e.g. .../manifest.json + packs/x.json
    let trimmed = url.trim_start_matches('/');
    match base.rfind('/') {
        Some(i) => format!("{}/{}", &base[..i], trimmed),
        None => format!("{base}/{trimmed}"),
    }
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(bytes);
    h.finalize().iter().map(|b| format!("{b:02x}")).collect()
}

fn content_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = crate::store::data_dir(app)?.join("content");
    fs::create_dir_all(&dir).map_err(|e| format!("mkdir {}: {e}", dir.display()))?;
    Ok(dir)
}

fn read_index(dir: &PathBuf) -> Vec<InstalledMeta> {
    fs::read_to_string(dir.join("index.json"))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_index(dir: &PathBuf, list: &[InstalledMeta]) -> Result<(), String> {
    let json = serde_json::to_vec_pretty(list).map_err(|e| e.to_string())?;
    crate::store::write_atomic(&dir.join("index.json"), &json)
}

pub fn check(url: &str) -> Result<Manifest, String> {
    let bytes = fetch(url)?;
    let mut m: Manifest = serde_json::from_slice(&bytes)
        .map_err(|e| format!("manifest.json ntibyumvikanye neza: {e}"))?;
    for p in &mut m.packs {
        p.url = resolve(url, &p.url);
    }
    Ok(m)
}

pub fn default_url(app: &AppHandle) -> String {
    let Ok(dir) = app.path().resource_dir() else {
        return String::new();
    };
    let candidates = [
        dir.join("resources").join("feed.json"),
        dir.join("feed.json"),
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources").join("feed.json"),
    ];
    for c in candidates {
        if let Ok(s) = fs::read_to_string(&c) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                if let Some(u) = v.get("feedUrl").and_then(|u| u.as_str()) {
                    return u.to_string();
                }
            }
        }
    }
    String::new()
}

pub fn install(app: &AppHandle, manifest_url: &str, pack_id: &str) -> Result<InstalledPack, String> {
    let manifest = check(manifest_url)?;
    let pack = manifest
        .packs
        .iter()
        .find(|p| p.id == pack_id)
        .ok_or_else(|| format!("paketi '{pack_id}' ntabwo ibonetse"))?;

    let bytes = fetch(&pack.url)?;
    if !pack.sha256.is_empty() {
        let got = sha256_hex(&bytes);
        if !got.eq_ignore_ascii_case(&pack.sha256) {
            return Err(format!(
                "paketi yanduye (sha256 itandukanye). Yiteguye: {}, yabonetse: {got}",
                pack.sha256
            ));
        }
    }
    // Must be valid JSON before we touch what is on disk.
    let content: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|e| format!("paketi ntabwo ari JSON yuzuye: {e}"))?;

    let dir = content_dir(app)?;
    let safe_id: String = pack
        .id
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    crate::store::write_atomic(&dir.join(format!("{safe_id}.json")), &bytes)?;

    let meta = InstalledMeta {
        id: pack.id.clone(),
        title: if pack.title.is_empty() { pack.id.clone() } else { pack.title.clone() },
        kind: pack.kind.clone(),
        version: pack.version.clone(),
        installed_at: now_iso(),
    };
    let mut list = read_index(&dir);
    list.retain(|m| m.id != meta.id);
    list.push(meta.clone());
    write_index(&dir, &list)?;

    Ok(InstalledPack { meta, content })
}

pub fn installed(app: &AppHandle) -> Vec<InstalledPack> {
    let Ok(dir) = content_dir(app) else {
        return Vec::new();
    };
    let index = read_index(&dir);
    let mut out = Vec::new();
    for meta in index {
        let safe_id: String = meta
            .id
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
            .collect();
        if let Ok(s) = fs::read_to_string(dir.join(format!("{safe_id}.json"))) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                out.push(InstalledPack { meta, content: v });
            }
        }
    }
    out
}

pub fn uninstall(app: &AppHandle, pack_id: &str) -> Result<(), String> {
    let dir = content_dir(app)?;
    let safe_id: String = pack_id
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let _ = fs::remove_file(dir.join(format!("{safe_id}.json")));
    let mut list = read_index(&dir);
    list.retain(|m| m.id != pack_id);
    write_index(&dir, &list)
}

fn now_iso() -> String {
    // Seconds since the epoch is enough for "installed at"; the UI formats it.
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", now.as_secs())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    /// Serves one HTTP response on a random localhost port.
    fn serve_once(body: &'static str) -> u16 {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
        let port = listener.local_addr().unwrap().port();
        std::thread::spawn(move || {
            if let Ok((mut stream, _)) = listener.accept() {
                let mut buf = [0u8; 1024];
                let _ = stream.read(&mut buf);
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(resp.as_bytes());
            }
        });
        port
    }

    #[test]
    fn manifest_is_fetched_and_relative_pack_urls_resolved() {
        let body = r#"{"version":1,"updated":"2026-01-01","message":"hi","packs":[{"id":"p1","title":"Pack","type":"devotionals","version":"1.0.0","url":"packs/p1.json","sha256":"","size":10}]}"#;
        let port = serve_once(body);
        let base = format!("http://127.0.0.1:{port}/bibile/manifest.json");
        let m = check(&base).expect("manifest should parse");
        assert_eq!(m.packs.len(), 1);
        assert_eq!(m.packs[0].id, "p1");
        // Resolved next to the manifest, not at the site root.
        assert_eq!(
            m.packs[0].url,
            format!("http://127.0.0.1:{port}/bibile/packs/p1.json")
        );
    }

    #[test]
    fn absolute_pack_urls_are_preserved() {
        assert_eq!(
            resolve("https://host/a/manifest.json", "https://cdn.example/p.json"),
            "https://cdn.example/p.json"
        );
        assert_eq!(
            resolve("https://host/a/manifest.json", "/packs/x.json"),
            "https://host/a/packs/x.json"
        );
    }

    #[test]
    fn sha256_matches_known_digest() {
        assert_eq!(
            sha256_hex(b""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        assert_eq!(
            sha256_hex(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn unreachable_feed_reports_an_error_instead_of_panicking() {
        // Port 1 is not serving anything: the reader must degrade gracefully.
        assert!(check("http://127.0.0.1:1/manifest.json").is_err());
    }
}
