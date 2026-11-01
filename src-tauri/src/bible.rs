//! Bible text engine.
//!
//! The text ships as a single flat UTF-8 blob with one verse per line. At startup
//! we index the newline offsets once (~5 ms) and slice from there, so reading a
//! chapter never parses anything: it is a handful of `&str` slices.

use memchr::{memchr_iter, memmem};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookMeta {
    pub id: String,
    pub osis: String,
    pub name: String,
    pub abbr: String,
    pub testament: String,
    pub index: usize,
    pub chapters: usize,
    pub verses: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Translation {
    pub id: String,
    pub name: String,
    pub short: String,
    pub language: String,
    pub year: u32,
    pub publisher: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Meta {
    pub format: u32,
    pub translation: Translation,
    pub books: Vec<BookMeta>,
    pub total_verses: usize,
    pub total_chapters: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct Hit {
    pub book: usize,
    pub chapter: usize,
    pub verse: usize,
    pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchPage {
    pub total: usize,
    pub capped: bool,
    pub hits: Vec<Hit>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CrossRef {
    pub book: usize,
    pub chapter: usize,
    pub verse: usize,
    pub end_book: usize,
    pub end_chapter: usize,
    pub end_verse: usize,
    pub label: String,
    pub text: String,
}

pub struct Bible {
    pub meta: Meta,
    text: String,
    /// Lowercased copy of the blob, byte-for-byte the same length, used for search.
    lower: Option<String>,
    /// Verse start offsets; `starts[total]` is the blob length.
    starts: Vec<usize>,
    chapter_start: Vec<Vec<usize>>,
    v_book: Vec<u16>,
    v_ch: Vec<u16>,
    v_num: Vec<u16>,
}

impl Bible {
    pub fn load(bin: &Path) -> Result<Self, String> {
        let bytes = fs::read(bin).map_err(|e| format!("{}: {e}", bin.display()))?;
        if bytes.len() < 12 || &bytes[0..4] != b"BYB1" {
            return Err("bible.bin: bad header".into());
        }
        let meta_len = u32::from_le_bytes(bytes[4..8].try_into().unwrap()) as usize;
        let text_len = u32::from_le_bytes(bytes[8..12].try_into().unwrap()) as usize;
        let meta_end = 12 + meta_len;
        if bytes.len() < meta_end + text_len {
            return Err("bible.bin: truncated".into());
        }
        let meta: Meta =
            serde_json::from_slice(&bytes[12..meta_end]).map_err(|e| format!("bible.bin meta: {e}"))?;
        let text = String::from_utf8(bytes[meta_end..meta_end + text_len].to_vec())
            .map_err(|e| format!("bible.bin text: {e}"))?;

        // Index verse boundaries with SIMD newline search.
        let mut starts = Vec::with_capacity(meta.total_verses + 1);
        starts.push(0usize);
        for i in memchr_iter(b'\n', text.as_bytes()) {
            starts.push(i + 1);
        }
        // The blob ends with a newline, so the final entry is the text length.
        if starts.len() != meta.total_verses + 1 {
            return Err(format!(
                "bible.bin: expected {} verses, found {}",
                meta.total_verses,
                starts.len() - 1
            ));
        }
        starts[meta.total_verses] = text.len().min(starts[meta.total_verses]);

        let mut chapter_start = Vec::with_capacity(meta.books.len());
        let mut v_book = Vec::with_capacity(meta.total_verses);
        let mut v_ch = Vec::with_capacity(meta.total_verses);
        let mut v_num = Vec::with_capacity(meta.total_verses);
        let mut g = 0usize;
        for b in &meta.books {
            let mut cs = Vec::with_capacity(b.chapters);
            for (ci, &n) in b.verses.iter().enumerate() {
                cs.push(g);
                for vi in 0..n {
                    v_book.push(b.index as u16);
                    v_ch.push(ci as u16);
                    v_num.push((vi + 1) as u16);
                }
                g += n;
            }
            chapter_start.push(cs);
        }

        let lower = text.to_lowercase();
        // Only usable as a parallel index when byte offsets line up exactly.
        let lower = if lower.len() == text.len() { Some(lower) } else { None };
        Ok(Bible {
            meta,
            text,
            lower,
            starts,
            chapter_start,
            v_book,
            v_ch,
            v_num,
        })
    }

    #[inline]
    fn verse_str(&self, vi: usize) -> &str {
        let a = self.starts[vi];
        let b = self.starts[vi + 1].saturating_sub(1).max(a);
        &self.text[a..b]
    }

    pub fn chapter(&self, book: usize, chapter: usize) -> Vec<String> {
        let Some(b) = self.meta.books.get(book) else {
            return Vec::new();
        };
        if chapter == 0 || chapter > b.chapters {
            return Vec::new();
        }
        let start = self.chapter_start[book][chapter - 1];
        let count = b.verses[chapter - 1];
        (start..start + count)
            .map(|vi| self.verse_str(vi).to_string())
            .collect()
    }

    pub fn passage(&self, book: usize, chapter: usize, from: usize, to: usize) -> Vec<Hit> {
        let Some(b) = self.meta.books.get(book) else {
            return Vec::new();
        };
        if chapter == 0 || chapter > b.chapters {
            return Vec::new();
        }
        let count = b.verses[chapter - 1];
        let start = from.max(1);
        let end = to.max(start).min(count);
        let base = self.chapter_start[book][chapter - 1];
        (start..=end)
            .map(|v| Hit {
                book,
                chapter,
                verse: v,
                text: self.verse_str(base + v - 1).to_string(),
            })
            .collect()
    }

    /// Case-insensitive substring search over the whole text.
    ///
    /// `scope` filters by testament ("OT"/"NT"); `limit == 0` means "count only".
    pub fn search(&self, query: &str, scope: Option<&str>, offset: usize, limit: usize) -> SearchPage {
        let q = query.trim();
        if q.is_empty() {
            return SearchPage { total: 0, capped: false, hits: Vec::new() };
        }
        let needle = q.to_lowercase();
        let hay: &[u8] = match &self.lower {
            Some(l) => l.as_bytes(),
            None => self.text.as_bytes(),
        };
        let mut total = 0usize;
        let mut capped = false;
        let mut hits = Vec::new();
        let mut last_verse = usize::MAX;
        const SCAN_CAP: usize = 250_000;

        for pos in memmem::find_iter(hay, needle.as_bytes()) {
            // Which verse contains this byte offset?
            let vi = self.starts.partition_point(|&s| s <= pos) - 1;
            if vi == last_verse {
                continue;
            }
            last_verse = vi;
            if let Some(sc) = scope {
                let book = self.meta.books[self.v_book[vi] as usize].testament.as_str();
                if book != sc {
                    continue;
                }
            }
            total += 1;
            if total > SCAN_CAP {
                capped = true;
                break;
            }
            if total > offset && hits.len() < limit {
                hits.push(Hit {
                    book: self.v_book[vi] as usize,
                    chapter: self.v_ch[vi] as usize + 1,
                    verse: self.v_num[vi] as usize,
                    text: self.verse_str(vi).to_string(),
                });
            }
            if limit > 0 && hits.len() >= limit && total > offset + limit {
                // Keep counting for an accurate total up to the cap.
                continue;
            }
        }

        SearchPage { total, capped, hits }
    }

    pub fn label(&self, book: usize, chapter: usize, verse: usize) -> String {
        let name = self
            .meta
            .books
            .get(book)
            .map(|b| b.name.as_str())
            .unwrap_or("?");
        format!("{name} {chapter}:{verse}")
    }

    pub fn reference(&self, vi: usize) -> CrossRef {
        let b = self.v_book[vi] as usize;
        let c = self.v_ch[vi] as usize;
        let v = self.v_num[vi] as usize;
        CrossRef {
            book: b,
            chapter: c,
            verse: v,
            end_book: b,
            end_chapter: c,
            end_verse: v,
            label: self.label(b, c, v),
            text: self.verse_str(vi).to_string(),
        }
    }

    pub fn verse_count(&self) -> usize {
        self.meta.total_verses
    }
}

/* ------------------------------------------------------- cross references ---- */

pub struct Xrefs {
    counts: Vec<u32>,
    offsets: Vec<u32>,
    entries: Vec<u32>,
}

impl Xrefs {
    pub fn load(path: &Path) -> Result<Self, String> {
        let bytes = fs::read(path).map_err(|e| format!("{}: {e}", path.display()))?;
        if bytes.len() < 8 || &bytes[0..4] != b"BXR1" {
            return Err("xref.bin: bad header".into());
        }
        let n = u32::from_le_bytes(bytes[4..8].try_into().unwrap()) as usize;
        let counts_bytes = n * 4;
        if bytes.len() < 8 + counts_bytes {
            return Err("xref.bin: truncated".into());
        }
        let mut counts = Vec::with_capacity(n);
        for i in 0..n {
            let o = 8 + i * 4;
            counts.push(u32::from_le_bytes(bytes[o..o + 4].try_into().unwrap()));
        }
        let rest = &bytes[8 + counts_bytes..];
        let mut entries = Vec::with_capacity(rest.len() / 4);
        for chunk in rest.chunks_exact(4) {
            entries.push(u32::from_le_bytes(chunk.try_into().unwrap()));
        }
        let mut offsets = Vec::with_capacity(n + 1);
        let mut acc = 0u32;
        offsets.push(0);
        for c in &counts {
            acc += c;
            offsets.push(acc);
        }
        Ok(Xrefs { counts, offsets, entries })
    }

    pub fn for_verse(&self, bible: &Bible, book: usize, chapter: usize, verse: usize) -> Vec<CrossRef> {
        let Some(b) = bible.meta.books.get(book) else {
            return Vec::new();
        };
        if chapter == 0 || chapter > b.chapters || verse == 0 || verse > b.verses[chapter - 1] {
            return Vec::new();
        }
        let gi = bible.chapter_start[book][chapter - 1] + verse - 1;
        if gi >= self.counts.len() {
            return Vec::new();
        }
        let a = self.offsets[gi] as usize;
        let z = self.offsets[gi + 1] as usize;
        let mut out = Vec::with_capacity(z - a);
        for pair in self.entries[a..z].chunks_exact(2) {
            let s = pair[0] as usize;
            let e = pair[1] as usize;
            if s >= bible.verse_count() {
                continue;
            }
            let mut r = bible.reference(s);
            if e < bible.verse_count() && e != s {
                let end = bible.reference(e);
                r.end_book = end.book;
                r.end_chapter = end.chapter;
                r.end_verse = end.verse;
                if end.book == r.book && end.chapter == r.chapter {
                    r.label = format!(
                        "{} {}:{}-{}",
                        bible.meta.books[r.book].name, r.chapter, r.verse, r.end_verse
                    );
                } else {
                    r.label = format!(
                        "{} {}:{}-{} {}:{}",
                        bible.meta.books[r.book].name,
                        r.chapter,
                        r.verse,
                        bible.meta.books[end.book].name,
                        end.chapter,
                        end.verse
                    );
                }
            }
            out.push(r);
        }
        out
    }
}
