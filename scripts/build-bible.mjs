/**
 * Build pipeline: Zefania XML  ->  compact binary Bible for the app.
 *
 * Output (src-tauri/resources/):
 *   bible.bin  – zero-parse container: magic + meta JSON + one flat UTF-8 verse blob
 *   xref.bin   – CSR cross-reference table keyed by global verse index
 *
 * The runtime never parses XML or JSON per verse: it mmaps the blob and slices
 * ranges, which is why chapter switching is instant.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "source", "bysb.xml");
const XREF_SRC = join(root, "source", "cross_references.txt");
const OUT = join(root, "src-tauri", "resources");
mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- books ---- */
/* Canonical order + Kinyarwanda names, OSIS codes (for cross references) and
   short abbreviations used by the reference picker. */
const BOOKS = [
  ["GEN", "Gen", "Itangiriro", "Int", "OT"],
  ["EXO", "Exod", "Kuva", "Kuv", "OT"],
  ["LEV", "Lev", "Abalewi", "Abl", "OT"],
  ["NUM", "Num", "Kubara", "Kub", "OT"],
  ["DEU", "Deut", "Gutegeka kwa Kabiri", "Gtk", "OT"],
  ["JOS", "Josh", "Yosuwa", "Yos", "OT"],
  ["JDG", "Judg", "Abacamanza", "Bcm", "OT"],
  ["RUT", "Ruth", "Rusi", "Rus", "OT"],
  ["1SA", "1Sam", "1 Samweli", "1Sam", "OT"],
  ["2SA", "2Sam", "2 Samweli", "2Sam", "OT"],
  ["1KI", "1Kgs", "1 Abami", "1Abm", "OT"],
  ["2KI", "2Kgs", "2 Abami", "2Abm", "OT"],
  ["1CH", "1Chr", "1 Ngoma", "1Ngo", "OT"],
  ["2CH", "2Chr", "2 Ngoma", "2Ngo", "OT"],
  ["EZR", "Ezra", "Ezira", "Ezr", "OT"],
  ["NEH", "Neh", "Nehemiya", "Neh", "OT"],
  ["EST", "Esth", "Esiteri", "Est", "OT"],
  ["JOB", "Job", "Yobu", "Yob", "OT"],
  ["PSA", "Ps", "Zaburi", "Zab", "OT"],
  ["PRO", "Prov", "Imigani", "Imi", "OT"],
  ["ECC", "Eccl", "Umubwiriza", "Umu", "OT"],
  ["SNG", "Song", "Indirimbo ya Salomo", "Ind", "OT"],
  ["ISA", "Isa", "Yesaya", "Yes", "OT"],
  ["JER", "Jer", "Yeremiya", "Yer", "OT"],
  ["LAM", "Lam", "Amaganya ya Yeremiya", "Amg", "OT"],
  ["EZK", "Ezek", "Ezekiyeli", "Ezk", "OT"],
  ["DAN", "Dan", "Daniyeli", "Dan", "OT"],
  ["HOS", "Hos", "Hoseya", "Hos", "OT"],
  ["JOL", "Joel", "Yoweli", "Yow", "OT"],
  ["AMO", "Amos", "Amosi", "Amo", "OT"],
  ["OBA", "Obad", "Obadiya", "Oba", "OT"],
  ["JON", "Jonah", "Yona", "Yon", "OT"],
  ["MIC", "Mic", "Mika", "Mik", "OT"],
  ["NAM", "Nah", "Nahumu", "Nah", "OT"],
  ["HAB", "Hab", "Habakuki", "Hab", "OT"],
  ["ZEP", "Zeph", "Zefaniya", "Zef", "OT"],
  ["HAG", "Hag", "Hagayi", "Hag", "OT"],
  ["ZEC", "Zech", "Zekariya", "Zek", "OT"],
  ["MAL", "Mal", "Malaki", "Mal", "OT"],
  ["MAT", "Matt", "Matayo", "Mat", "NT"],
  ["MRK", "Mark", "Mariko", "Mar", "NT"],
  ["LUK", "Luke", "Luka", "Luk", "NT"],
  ["JHN", "John", "Yohana", "Yoh", "NT"],
  ["ACT", "Acts", "Ibyakozwe n'Intumwa", "Iby", "NT"],
  ["ROM", "Rom", "Abaroma", "Rom", "NT"],
  ["1CO", "1Cor", "1 Abakorinto", "1Kor", "NT"],
  ["2CO", "2Cor", "2 Abakorinto", "2Kor", "NT"],
  ["GAL", "Gal", "Abagalatiya", "Gal", "NT"],
  ["EPH", "Eph", "Abefeso", "Efe", "NT"],
  ["PHP", "Phil", "Abafilipi", "Fil", "NT"],
  ["COL", "Col", "Abakolosayi", "Kol", "NT"],
  ["1TH", "1Thess", "1 Abatesalonike", "1Tes", "NT"],
  ["2TH", "2Thess", "2 Abatesalonike", "2Tes", "NT"],
  ["1TI", "1Tim", "1 Timoteyo", "1Tim", "NT"],
  ["2TI", "2Tim", "2 Timoteyo", "2Tim", "NT"],
  ["TIT", "Titus", "Tito", "Tit", "NT"],
  ["PHM", "Phlm", "Filemoni", "Flm", "NT"],
  ["HEB", "Heb", "Abaheburayo", "Heb", "NT"],
  ["JAS", "Jas", "Yakobo", "Yak", "NT"],
  ["1PE", "1Pet", "1 Petero", "1Pet", "NT"],
  ["2PE", "2Pet", "2 Petero", "2Pet", "NT"],
  ["1JN", "1John", "1 Yohana", "1Yoh", "NT"],
  ["2JN", "2John", "2 Yohana", "2Yoh", "NT"],
  ["3JN", "3John", "3 Yohana", "3Yoh", "NT"],
  ["JUD", "Jude", "Yuda", "Yud", "NT"],
  ["REV", "Rev", "Ibyahishuwe", "Ibyah", "NT"],
].map(([id, osis, name, abbr, testament]) => ({ id, osis, name, abbr, testament }));

/* ------------------------------------------------------------ clean text ---- */
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function clean(raw) {
  let s = String(raw ?? "");
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  s = s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  s = s.replace(/&([a-zA-Z]+);/g, (m, e) => ENTITIES[e] ?? m);
  // Collapse the pretty-printed indentation/newlines inside verses.
  s = s.replace(/\s+/g, " ").trim();
  // Normalise the apostrophes/quote glyphs used in the source.
  s = s.replace(/[\u2018\u2019\u201B]/g, "\u2019").replace(/[\u201C\u201D]/g, "\u201C");
  return s;
}

/* -------------------------------------------------------------- parse it ---- */
console.log("reading", SRC);
const xml = readFileSync(SRC, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "BIBLEBOOK" || name === "CHAPTER" || name === "VERS",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
});
const doc = parser.parse(xml);
const books = doc.XMLBIBLE?.BIBLEBOOK ?? [];
console.log("books found:", books.length);

const outBooks = [];
const verseTexts = []; // flat, canonical order
for (let i = 0; i < BOOKS.length; i++) {
  const meta = BOOKS[i];
  const node = books[i];
  if (!node) throw new Error(`missing book ${i + 1} (${meta.name})`);
  const chapters = node.CHAPTER ?? [];
  const verseCounts = [];
  for (const ch of chapters) {
    const vers = ch.VERS ?? [];
    let n = 0;
    for (const v of vers) {
      const t = clean(typeof v === "object" ? (v["#text"] ?? "") : v);
      verseTexts.push(t);
      n++;
    }
    verseCounts.push(n);
  }
  // Normalise: some editions may skip chapter 1 placeholders.
  outBooks.push({ ...meta, index: i, chapters: verseCounts.length, verses: verseCounts });
}

const totalVerses = verseTexts.length;
const totalChapters = outBooks.reduce((a, b) => a + b.chapters, 0);
console.log(`chapters: ${totalChapters}  verses: ${totalVerses}`);

const empty = verseTexts.filter((t) => t.length === 0).length;
if (empty) console.warn(`warning: ${empty} empty verses`);

/* ------------------------------------------------------------ bible.bin ---- */
const meta = {
  format: 1,
  translation: {
    id: "BYSB",
    name: "Bibiliya Yera",
    short: "BYSB",
    language: "Kinyarwanda",
    year: 2001,
    publisher: "Bible Society of Rwanda",
  },
  books: outBooks,
  totalVerses,
  totalChapters,
};
const metaBuf = Buffer.from(JSON.stringify(meta), "utf8");
const textBuf = Buffer.from(verseTexts.join("\n") + "\n", "utf8");

const head = Buffer.alloc(12);
head.write("BYB1", 0, "latin1");
head.writeUInt32LE(metaBuf.length, 4);
head.writeUInt32LE(textBuf.length, 8);
const bin = Buffer.concat([head, metaBuf, textBuf]);
writeFileSync(join(OUT, "bible.bin"), bin);
console.log(
  `bible.bin ${(bin.length / 1048576).toFixed(2)} MB (meta ${metaBuf.length} B, text ${(textBuf.length / 1048576).toFixed(2)} MB)`,
);

/* ------------------------------------------------------------- xref.bin ---- */
/* Map global (book.chapter.verse) -> flat index so the runtime can look up
   references in O(1). */
const osis = new Map(BOOKS.map((b, i) => [b.osis.toLowerCase(), i]));
const chapterStart = []; // [bookIndex] -> array of first global index per chapter
let g = 0;
for (const b of outBooks) {
  const starts = [];
  for (const n of b.verses) {
    starts.push(g);
    g += n;
  }
  chapterStart.push(starts);
}

function toIndex(ref) {
  // "Gen.1.1" -> global index, or null when the book is outside our canon.
  const m = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/.exec(ref.trim());
  if (!m) return null;
  const bi = osis.get(m[1].toLowerCase());
  if (bi === undefined) return null;
  const ci = Number(m[2]) - 1;
  const vi = Number(m[3]) - 1;
  const counts = outBooks[bi].verses;
  if (ci < 0 || ci >= counts.length) return null;
  if (vi < 0) vi = 0;
  if (vi >= counts[ci]) return null;
  return chapterStart[bi][ci] + vi;
}

const perVerse = Array.from({ length: totalVerses }, () => []);
let parsed = 0;
let skipped = 0;

if (existsSync(XREF_SRC)) {
  const lines = readFileSync(XREF_SRC, "utf8").split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const [from, to, votesRaw] = line.split("\t");
    if (!from || !to) continue;
    const votes = Number(votesRaw) || 0;
    if (votes < 3) continue;
    const fi = toIndex(from);
    if (fi === null) continue;
    // "Jer.32.17" or a range "Ps.119.1-Ps.119.8"
    const [a, b] = to.split("-");
    let start = toIndex(a);
    if (start === null) { skipped++; continue; }
    let end = b ? toIndex(b) : start;
    if (end === null || end < start) end = start;
    perVerse[fi].push({ start, end, votes });
    parsed++;
  }
}

// Keep the best-known references per verse (a study Bible shows a handful).
const MAX_REFS = 10;
const counts = new Uint32Array(totalVerses);
const entries = [];
for (let i = 0; i < totalVerses; i++) {
  const list = perVerse[i];
  let picked = [];
  if (list.length) {
    list.sort((x, y) => y.votes - x.votes || x.start - y.start);
    const seen = new Set();
    for (const r of list) {
      const key = `${r.start}:${r.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(r);
      if (picked.length >= MAX_REFS) break;
    }
  }
  counts[i] = picked.length;
  for (const r of picked) entries.push(r.start, r.end);
}

const xhead = Buffer.alloc(8);
xhead.write("BXR1", 0, "latin1");
xhead.writeUInt32LE(totalVerses, 4);
const countsBuf = Buffer.from(counts.buffer, counts.byteOffset, counts.byteLength);
const entryBuf = Buffer.alloc(entries.length * 4);
entries.forEach((v, i) => entryBuf.writeUInt32LE(v, i * 4));
const xbin = Buffer.concat([xhead, countsBuf, entryBuf]);
writeFileSync(join(OUT, "xref.bin"), xbin);
console.log(
  `xref.bin ${(xbin.length / 1048576).toFixed(2)} MB (${entries.length / 2} references, ${skipped} unresolved, ${parsed} parsed)`,
);

/* --------------------------------------------------------------- sanity ---- */
const versesWithRefs = counts.reduce((a, c) => a + (c > 0 ? 1 : 0), 0);
console.log(`verses with cross references: ${versesWithRefs} / ${totalVerses}`);
console.log("sample:", outBooks[0].name, outBooks[0].verses.slice(0, 3), verseTexts[0]);
