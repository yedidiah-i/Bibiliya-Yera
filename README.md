# Bibiliya Yera — desktop

A fast, fully offline Kinyarwanda Bible for Windows, with study tools and an
optional online content channel for material you publish later.

- **Offline first** — the whole Bible ships inside the app. Reading, search,
  cross references, notes, highlights and reading plans all work with no network.
- **Online when available** — the reader can pull devotional packs and study
  notes that you host, without reinstalling. Nothing is sent anywhere.
- **Small and quick** — a native Tauri app (~10 MB installer, no bundled
  Chromium), a Rust text engine that keeps the Bible in memory, and a
  search that scans all 31,167 verses in a few milliseconds.

---

## What is inside

| Area | Details |
| --- | --- |
| Text | Bibiliya Yera (BYSB, 2001) — 66 books, 1,189 chapters, 31,167 verses |
| Reading | Paragraph or verse-per-line, serif/sans, adjustable size, width, line height |
| Study | 155,000 cross references (openbible.info, CC-BY) resolved to Kinyarwanda labels |
| Search | Case-insensitive full-text search, whole-Bible or per-testament |
| Personal | Highlights (5 colours), notes, bookmarks, continue-reading history |
| Plans | Whole Bible in a year, NT in 90 days, Gospels in 30 days, Psalms + Proverbs in 31 |
| Daily | Verse of the day, greeting/home dashboard |
| Data | Portable JSON backup export/import |
| Online | Content feed: devotional packs + study notes, verified by SHA-256 |
| Themes | Umucyo (light), Sepia, Ijoro (dark) |

Keyboard: `Ctrl K` command palette, `Ctrl F` search, `Alt ←/→` change chapter,
`Ctrl +/-` text size, `j`/`k` scroll, `Esc` clear selection.

---

## Install (users)

Run `Bibiliya Yera_1.0.0_x64-setup.exe` (or the `.msi`) and follow the wizard.
The app installs per-user and needs no administrator rights. Windows 10/11
includes the WebView2 runtime it uses; on older machines the installer adds it.

Where your data lives: `%APPDATA%\rw.bibiliyayera.bible\`
(`state.json`, plus installed content packs in `content\`).
Removing the app leaves your notes intact; delete that folder to erase them.

---

## Build from source

Requirements: Node 20+, Rust stable (MSVC toolchain), Visual Studio Build Tools
with the C++ workload, and the WebView2 runtime (present on Windows 10/11).

```bash
npm install
npm run data        # build src-tauri/resources/bible.bin + xref.bin
npm run app:dev     # run the desktop app with hot reload
npm run app:build   # produce the installers in src-tauri/target/release/bundle/
```

### Data pipeline

`npm run data` reads `source/bysb.xml` (Zefania XML) and
`source/cross_references.txt`, then writes two compact binaries:

```
src-tauri/resources/bible.bin   BYB1 | meta JSON | one UTF-8 blob, one verse per line
src-tauri/resources/xref.bin    BXR1 | per-verse counts | (start,end) verse-index pairs
```

To refresh the source material:

```bash
mkdir -p source
curl -L -o source/bysb.xml https://raw.githubusercontent.com/inezabonte/bysb/main/bysb.xml
curl -L -o source/xrefs.zip https://a.openbible.info/data/cross-references.zip
unzip -o source/xrefs.zip -d source
npm run data
```

### Why it does not lag

- The text is loaded once into Rust memory at startup (~40 ms). Reading a chapter
  is a slice of the in-memory blob, not a parse or a database query.
- Search lowercases the blob once, then uses memchr's SIMD substring search,
  mapping byte offsets back to verses with a binary search over newline offsets.
- The React layer renders only the visible chapter (≤176 verses) and keeps a
  16-chapter LRU cache so back/forward navigation is instant.
- Release profile uses `lto`, `codegen-units = 1`, `opt-level = "s"`, and strips
  symbols; the frontend bundle is ~90 kB gzipped with no UI framework beyond React.

---

## Publishing new content (the online half)

The app never invents a server: you host one static folder. `feed/` is that folder.

```bash
# 1. edit or add packs in feed/packs/*.json
npm run feed:build      # regenerates feed/manifest.json with sizes + sha256
npm run feed            # serves http://127.0.0.1:8788/manifest.json for testing
```

Open **Ibyongewe** in the app, paste `http://127.0.0.1:8788/manifest.json`, press
**Genzura**, then install a pack. Installed packs work offline immediately.

To ship it for real: upload the contents of `feed/` to any static host
(GitHub Pages, Cloudflare Pages, S3, nginx), then set `feedUrl` in
`src-tauri/resources/feed.json` to the public `manifest.json` before building so
every new installation points at it. Users can always override the address in
**Ibyongewe**, and the app stays fully offline if the address is empty or
unreachable.

### Pack format

```json
{
  "id": "devotionals-kinyarwanda",
  "type": "devotionals",          // "devotionals" | "notes"
  "title": "Ibitekerezo bya buri munsi",
  "version": "1.0.0",
  "notes": "Short changelog line",
  "items": [ /* see below */ ]
}
```

Devotional item — no `date` means it joins the daily rotation; with `date`
(`"MM-DD"`) it appears on that calendar day:

```json
{ "date": "12-25", "title": "…", "body": "…", "ref": { "book": 42, "chapter": 8, "verse": 12 } }
```

Study note item — shown in the side panel when that verse is selected:

```json
{ "book": 42, "chapter": 3, "verse": 16, "text": "…" }
```

`book` is the zero-based canonical index (Itangiriro = 0, Matayo = 39,
Ibyahishuwe = 65). Increase `version` to offer an update; the app compares it
against what is installed.

Downloads are rejected unless the size and SHA-256 in `manifest.json` match, and
a pack must parse as JSON before it replaces the installed copy.

---

## Project layout

```
scripts/build-bible.mjs   XML + cross references  ->  binary Bible
scripts/make-icon.mjs     generates the app icon (no image dependency)
scripts/build-feed.mjs    packs -> manifest.json with hashes
scripts/serve-feed.mjs    local static feed server
src-tauri/src/bible.rs    text engine: chapter slicing, search, cross references
src-tauri/src/feed.rs     feed check/install/uninstall
src-tauri/src/store.rs    atomic JSON state persistence
src/lib/                  API types, store, plans, content packs, formatting
src/components/           reader, sidebar, home, search, plans, saved, online, settings
feed/                     publishable content (manifest + packs)
```

---

## Licensing — please read before distributing

The app code here is yours to do with as you wish. **The Bible text is not the
app's to license.** Bibiliya Yera (BYSB) is © Bible Society of Rwanda. It was
obtained from a public Zefania XML copy for this project; that copy carries no
licence grant from the rights holder. For personal/ministry use keep it local;
for public distribution (installers on a website, app stores) obtain written
permission from the Bible Society of Rwanda first.

Cross references come from <https://www.openbible.info/labs/cross-references/>
and are licensed CC-BY — credit "Cross references from openbible.info".
