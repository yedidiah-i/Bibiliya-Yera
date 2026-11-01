import type { Meta } from "./api";

export interface PlanChapter {
  book: number;
  chapter: number;
}
export interface PlanDay {
  day: number;
  chapters: PlanChapter[];
}
export interface Plan {
  id: string;
  title: string;
  subtitle: string;
  days: PlanDay[];
}

function take(all: PlanChapter[], days: number): PlanDay[] {
  // Even split with the remainder spread over the first days: day sizes stay
  // within one chapter of each other so no day feels like a chore.
  const base = Math.floor(all.length / days);
  const extra = all.length % days;
  const out: PlanDay[] = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const n = base + (d < extra ? 1 : 0);
    if (n === 0) continue;
    out.push({ day: out.length + 1, chapters: all.slice(i, i + n) });
    i += n;
  }
  return out;
}

function chaptersOf(meta: Meta, from: number, to: number): PlanChapter[] {
  const out: PlanChapter[] = [];
  for (let b = from; b <= to; b++) {
    for (let c = 1; c <= meta.books[b].chapters; c++) out.push({ book: b, chapter: c });
  }
  return out;
}

export function buildPlans(meta: Meta): Plan[] {
  const last = meta.books.length - 1;
  const ot = chaptersOf(meta, 0, 38);
  const nt = chaptersOf(meta, 39, last);
  const gospels = chaptersOf(meta, 39, 42); // Matayo .. Yohana
  const psalms = chaptersOf(meta, 18, 18);
  const proverbs = chaptersOf(meta, 19, 19);

  return [
    {
      id: "bible-365",
      title: "Bibiliya yose mu mwaka",
      subtitle: "Ibice 1.189 · iminsi 365",
      days: take([...ot, ...nt], 365),
    },
    {
      id: "nt-90",
      title: "Isezerano Rishya mu minsi 90",
      subtitle: "Ibigize 260 · iminsi 90",
      days: take(nt, 90),
    },
    {
      id: "gospels-30",
      title: "Ivanjili mu minsi 30",
      subtitle: "Matayo, Mariko, Luka na Yohana",
      days: take(gospels, 30),
    },
    {
      id: "wisdom-31",
      title: "Zaburi n'Imigani mu minsi 31",
      subtitle: "Ubwenge bwa buri munsi",
      days: take([...psalms, ...proverbs], 31),
    },
  ];
}

export function planProgress(
  plan: Plan,
  progress: { done: number[]; started: number } | undefined,
) {
  const done = progress?.done.length ?? 0;
  const total = plan.days.length;
  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    nextDay: plan.days.find((d) => !progress?.done.includes(d.day)) ?? null,
  };
}

/**
 * Curated verses for "Umurongo w'umunsi" — a rotation of well-known passages.
 * Indices follow the canonical book order of the data file (Itangiriro = 0).
 */
export const DAILY_VERSES: Array<[number, number, number]> = [
  [42, 3, 16], // Yohana 3:16
  [18, 23, 1], // Zaburi 23:1
  [44, 8, 28], // Abaroma 8:28
  [49, 4, 13], // Abafilipi 4:13
  [19, 3, 5], // Imigani 3:5
  [22, 41, 10], // Yesaya 41:10
  [49, 4, 6], // Abafilipi 4:6
  [44, 5, 8], // Abaroma 5:8
  [45, 10, 13], // 1 Abakorinto 10:13
  [57, 11, 1], // Abaheburayo 11:1
  [18, 46, 1], // Zaburi 46:1
  [22, 40, 31], // Yesaya 40:31
  [18, 119, 105], // Zaburi 119:105
  [43, 1, 8], // Ibyakozwe 1:8
  [61, 1, 9], // 1 Yohana 1:9
  [19, 16, 3], // Imigani 16:3
  [44, 12, 2], // Abaroma 12:2
  [50, 3, 23], // Abakolosayi 3:23
  [58, 1, 5], // Yakobo 1:5
  [20, 3, 1], // Umubwiriza 3:1
  [18, 34, 18], // Zaburi 34:18
  [42, 14, 6], // Yohana 14:6
  [22, 26, 3], // Yesaya 26:3
  [65, 21, 4], // Ibyahishuwe 21:4
  [47, 5, 22], // Abagalatiya 5:22
  [40, 11, 24], // Mariko 11:24
  [18, 51, 10], // Zaburi 51:10
  [54, 1, 7], // 2 Timoteyo 1:7
  [59, 5, 7], // 1 Petero 5:7
  [19, 29, 25], // Imigani 29:25
  [39, 11, 28], // Matayo 11:28
  [22, 53, 5], // Yesaya 53:5
  [23, 29, 11], // Yeremiya 29:11
  [18, 27, 1], // Zaburi 27:1
  [48, 2, 8], // Abefeso 2:8
  [46, 5, 17], // 2 Abakorinto 5:17
];

export function verseOfTheDay(totalVerses: number, meta: Meta): { book: number; chapter: number; verse: number } {
  const now = new Date();
  const dayIndex = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2024, 0, 1)) / 86400000,
  );
  const pick = DAILY_VERSES[((dayIndex % DAILY_VERSES.length) + DAILY_VERSES.length) % DAILY_VERSES.length];
  const [b, c, v] = pick;
  if (meta.books[b] && c <= meta.books[b].chapters && v <= meta.books[b].verses[c - 1]) {
    return { book: b, chapter: c, verse: v };
  }
  // Safety net: derive a position from the verse count.
  const idx = Math.abs(dayIndex * 7919) % totalVerses;
  let acc = 0;
  for (const book of meta.books) {
    for (let ci = 0; ci < book.verses.length; ci++) {
      if (idx < acc + book.verses[ci]) {
        return { book: book.index, chapter: ci + 1, verse: idx - acc + 1 };
      }
      acc += book.verses[ci];
    }
  }
  return { book: 0, chapter: 1, verse: 1 };
}
