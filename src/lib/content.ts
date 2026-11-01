import type { InstalledPack } from "./api";
import { verseKey } from "./store";

export interface Devotional {
  date?: string; // "MM-DD"
  title: string;
  body: string;
  ref?: { book: number; chapter: number; verse?: number };
}

export interface Bundle {
  devotionals: Devotional[];
  notes: Record<string, string>;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function itemsOf(pack: InstalledPack): unknown[] {
  const c: unknown = pack.content;
  if (Array.isArray(c)) return c;
  if (isObj(c) && Array.isArray(c.items)) return c.items as unknown[];
  if (isObj(c) && Array.isArray(c.devotionals)) return c.devotionals as unknown[];
  return [];
}

function kindOf(pack: InstalledPack): string {
  if (pack.meta.type) return pack.meta.type;
  const c: unknown = pack.content;
  if (isObj(c) && typeof c.type === "string") return c.type;
  return "";
}

export function buildBundle(packs: InstalledPack[]): Bundle {
  const devotionals: Devotional[] = [];
  const notes: Record<string, string> = {};

  for (const pack of packs) {
    const kind = kindOf(pack);
    for (const raw of itemsOf(pack)) {
      if (!isObj(raw)) continue;
      if (kind === "notes") {
        const { book, chapter, verse, text } = raw;
        if (typeof book === "number" && typeof chapter === "number" && typeof verse === "number" && typeof text === "string") {
          notes[verseKey(book, chapter, verse)] = text;
        }
      } else if (kind === "devotionals") {
        const title = typeof raw.title === "string" ? raw.title : "";
        const body = typeof raw.body === "string" ? raw.body : "";
        if (!title || !body) continue;
        const r = raw.ref;
        devotionals.push({
          date: typeof raw.date === "string" ? raw.date : undefined,
          title,
          body,
          ref:
            isObj(r) && typeof r.book === "number" && typeof r.chapter === "number"
              ? {
                  book: r.book,
                  chapter: r.chapter,
                  verse: typeof r.verse === "number" ? r.verse : undefined,
                }
              : undefined,
        });
      }
    }
  }
  return { devotionals, notes };
}

export function todaysDevotional(bundle: Bundle, now = new Date()): Devotional | null {
  if (bundle.devotionals.length === 0) return null;
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dated = bundle.devotionals.find((d) => d.date === mmdd);
  if (dated) return dated;
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000,
  );
  return bundle.devotionals[dayOfYear % bundle.devotionals.length];
}
