import { useSyncExternalStore } from "react";
import { api } from "./api";

export type Theme = "light" | "sepia" | "night";

export interface Prefs {
  theme: Theme;
  fontSize: number; // px
  lineHeight: number;
  width: number; // reading column, px
  paragraph: boolean; // true = flowing paragraph, false = one verse per line
  verseNumbers: boolean;
  serif: boolean;
}

export interface Bookmark {
  book: number;
  chapter: number;
  verse: number;
  at: number;
  label?: string;
}

export interface Note {
  text: string;
  at: number;
}

export interface PlanProgress {
  done: number[]; // day indexes completed
  started: number;
}

export interface AppState {
  version: 1;
  prefs: Prefs;
  lastRead: { book: number; chapter: number; at: number } | null;
  history: { book: number; chapter: number; at: number }[];
  bookmarks: Bookmark[];
  highlights: Record<string, string>; // "book-chapter-verse" -> color key
  notes: Record<string, Note>;
  plans: Record<string, PlanProgress>;
  feed: { url: string; lastCheck: number };
}

export const HIGHLIGHT_COLORS = [
  { key: "gold", light: "#f6e3a8", dark: "#5a4a1e" },
  { key: "green", light: "#cfe8c9", dark: "#26452a" },
  { key: "blue", light: "#cfe0f5", dark: "#22364d" },
  { key: "rose", light: "#f7d3d3", dark: "#4d2626" },
  { key: "violet", light: "#e2d6f5", dark: "#372a4d" },
];

export const verseKey = (b: number, c: number, v: number) => `${b}-${c}-${v}`;

const defaultState = (): AppState => ({
  version: 1,
  prefs: {
    theme: "light",
    fontSize: 19,
    lineHeight: 1.72,
    width: 700,
    paragraph: true,
    verseNumbers: true,
    serif: true,
  },
  lastRead: null,
  history: [],
  bookmarks: [],
  highlights: {},
  notes: {},
  plans: {},
  feed: { url: "", lastCheck: 0 },
});

let state: AppState = defaultState();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;
let loaded = false;

function emit() {
  for (const l of listeners) l();
}

function scheduleSave() {
  if (!loaded) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    api.stateSave(JSON.stringify(state)).catch((e) => console.error("save failed", e));
  }, 450);
}

export function getState() {
  return state;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  emit();
  scheduleSave();
}

/** Flush pending writes (used on window close and after bulk imports). */
export async function flushSave() {
  window.clearTimeout(saveTimer);
  if (loaded) await api.stateSave(JSON.stringify(state)).catch(() => {});
}

export async function initStore() {
  try {
    const raw = await api.stateLoad();
    if (raw && raw.trim() !== "{}") {
      const parsed = JSON.parse(raw);
      state = {
        ...defaultState(),
        ...parsed,
        prefs: { ...defaultState().prefs, ...(parsed.prefs ?? {}) },
        feed: { ...defaultState().feed, ...(parsed.feed ?? {}) },
      };
    }
  } catch (e) {
    console.error("state load failed", e);
  }
  const feedUrl = await api.feedDefaultUrl().catch(() => "");
  if (feedUrl && !state.feed.url) state.feed.url = feedUrl;
  loaded = true;
  emit();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/* ------------------------------------------------------------- mutations -- */

export const actions = {
  setPrefs(patch: Partial<Prefs>) {
    update((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
  },
  openChapter(book: number, chapter: number) {
    update((s) => {
      const now = Date.now();
      const history = [
        { book, chapter, at: now },
        ...s.history.filter((h) => !(h.book === book && h.chapter === chapter)),
      ].slice(0, 24);
      return { ...s, lastRead: { book, chapter, at: now }, history };
    });
  },
  toggleBookmark(book: number, chapter: number, verse: number) {
    update((s) => {
      const exists = s.bookmarks.some(
        (b) => b.book === book && b.chapter === chapter && b.verse === verse,
      );
      return {
        ...s,
        bookmarks: exists
          ? s.bookmarks.filter(
              (b) => !(b.book === book && b.chapter === chapter && b.verse === verse),
            )
          : [{ book, chapter, verse, at: Date.now() }, ...s.bookmarks],
      };
    });
  },
  setHighlight(book: number, chapter: number, verse: number, color: string | null) {
    actions.setHighlightRange(book, chapter, verse, verse, color);
  },
  /** Applies one colour to every verse of a selection in a single state update. */
  setHighlightRange(
    book: number,
    chapter: number,
    from: number,
    to: number,
    color: string | null,
  ) {
    update((s) => {
      const highlights = { ...s.highlights };
      for (let v = from; v <= to; v++) {
        const key = verseKey(book, chapter, v);
        if (color) highlights[key] = color;
        else delete highlights[key];
      }
      return { ...s, highlights };
    });
  },
  setNote(book: number, chapter: number, verse: number, text: string) {
    update((s) => {
      const key = verseKey(book, chapter, verse);
      const notes = { ...s.notes };
      if (text.trim()) notes[key] = { text: text.trim(), at: Date.now() };
      else delete notes[key];
      return { ...s, notes };
    });
  },
  togglePlanDay(planId: string, day: number) {
    update((s) => {
      const cur = s.plans[planId] ?? { done: [], started: Date.now() };
      const done = cur.done.includes(day)
        ? cur.done.filter((d) => d !== day)
        : [...cur.done, day].sort((a, b) => a - b);
      return { ...s, plans: { ...s.plans, [planId]: { ...cur, done } } };
    });
  },
  startPlan(planId: string) {
    update((s) => ({
      ...s,
      plans: { ...s.plans, [planId]: s.plans[planId] ?? { done: [], started: Date.now() } },
    }));
  },
  setFeedUrl(url: string) {
    update((s) => ({ ...s, feed: { ...s.feed, url } }));
  },
  markFeedChecked() {
    update((s) => ({ ...s, feed: { ...s.feed, lastCheck: Date.now() } }));
  },
  replaceState(next: AppState) {
    state = { ...defaultState(), ...next };
    loaded = true;
    emit();
    scheduleSave();
  },
};

export { defaultState };
