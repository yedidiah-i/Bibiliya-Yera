import { invoke } from "@tauri-apps/api/core";

export interface BookMeta {
  id: string;
  osis: string;
  name: string;
  abbr: string;
  testament: "OT" | "NT";
  index: number;
  chapters: number;
  verses: number[];
}

export interface Meta {
  format: number;
  translation: {
    id: string;
    name: string;
    short: string;
    language: string;
    year: number;
    publisher: string;
  };
  books: BookMeta[];
  totalVerses: number;
  totalChapters: number;
}

export interface Hit {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface SearchPage {
  total: number;
  capped: boolean;
  hits: Hit[];
}

export interface CrossRef extends Hit {
  endBook: number;
  endChapter: number;
  endVerse: number;
  label: string;
}

export interface FeedPack {
  id: string;
  title: string;
  type: string;
  version: string;
  size?: number;
  sha256?: string;
  url: string;
  notes?: string;
}

export interface FeedManifest {
  version: number;
  updated: string;
  message: string;
  packs: FeedPack[];
}

export interface InstalledPack {
  meta: { id: string; title: string; type: string; version: string; installedAt: string };
  content: Record<string, unknown>;
}

export const api = {
  meta: () => invoke<Meta>("bible_meta"),
  chapter: (book: number, chapter: number) =>
    invoke<string[]>("bible_chapter", { book, chapter }),
  passage: (book: number, chapter: number, from: number, to: number) =>
    invoke<Hit[]>("bible_passage", { book, chapter, from, to }),
  search: (query: string, scope: string | null, offset = 0, limit = 60) =>
    invoke<SearchPage>("bible_search", { query, scope, offset, limit }),
  xrefs: (book: number, chapter: number, verse: number) =>
    invoke<CrossRef[]>("bible_xrefs", { book, chapter, verse }),
  stateLoad: () => invoke<string>("state_load"),
  stateSave: (json: string) => invoke<void>("state_save", { json }),
  feedDefaultUrl: () => invoke<string>("feed_default_url"),
  feedCheck: (url: string) => invoke<FeedManifest>("feed_check", { url }),
  feedInstall: (url: string, packId: string) =>
    invoke<InstalledPack>("feed_install", { url, packId }),
  feedInstalled: () => invoke<InstalledPack[]>("feed_installed"),
  feedUninstall: (packId: string) =>
    invoke<void>("feed_uninstall", { packId }),
  saveDialog: (defaultPath: string) =>
    import("@tauri-apps/plugin-dialog").then((m) =>
      m.save({ defaultPath, filters: [{ name: "JSON", extensions: ["json"] }] }),
    ),
  openDialog: () =>
    import("@tauri-apps/plugin-dialog").then((m) =>
      m.open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] }),
    ),
  backupExport: (path: string) => invoke<string>("backup_export", { path }),
  backupImport: (path: string) => invoke<string>("backup_import", { path }),
  sendSupportEmail: async (to: string, subject: string, body: string) => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await open(mailto);
      return true;
    } catch (e) {
      // Fallback to window location
      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      return true;
    }
  },
};
