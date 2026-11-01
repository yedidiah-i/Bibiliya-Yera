import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api, type InstalledPack, type Meta } from "./lib/api";
import {
  actions,
  applyTheme,
  flushSave,
  getState,
  initStore,
  useApp,
  type Theme,
} from "./lib/store";
import { buildBundle } from "./lib/content";
import { Sidebar, type View } from "./components/Sidebar";
import { Reader, type Selection } from "./components/Reader";
import { HomeView } from "./components/HomeView";
import { SearchView } from "./components/SearchView";
import { PlansView } from "./components/PlansView";
import { SavedView } from "./components/SavedView";
import { OnlineView } from "./components/OnlineView";
import { SettingsView } from "./components/SettingsView";
import { SupportView } from "./components/SupportView";
import { CommandPalette } from "./components/CommandPalette";
import { Icon } from "./components/Icon";

const THEME_ORDER: Theme[] = ["light", "sepia", "night"];

export default function App() {
  const app = useApp();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<View>("home");
  const [book, setBook] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [focusVerse, setFocusVerse] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [aside, setAside] = useState(false);
  const [query, setQuery] = useState("");
  const [palette, setPalette] = useState(false);
  const [packs, setPacks] = useState<InstalledPack[]>([]);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    let alive = true;
    (async () => {
      await initStore();
      const m = await api.meta();
      if (!alive) return;
      const state = getState();
      if (state.lastRead) {
        setBook(state.lastRead.book);
        setChapter(state.lastRead.chapter);
      }
      setMeta(m);
      setBooted(true);
      api.feedInstalled().then((p) => alive && setPacks(p)).catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    applyTheme(app.prefs.theme);
  }, [app.prefs.theme]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Persist before the window goes away — notes are never lost on close.
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const w = getCurrentWindow();
    w.onCloseRequested(async (event) => {
      event.preventDefault();
      try {
        await flushSave();
      } finally {
        try {
          await w.destroy();
        } catch {
          await w.close().catch(() => {});
        }
      }
    })
      .then((f) => {
        unlisten = f;
      })
      .catch(() => {});
    return () => unlisten?.();
  }, []);

  const refreshPacks = useCallback(() => {
    api.feedInstalled().then(setPacks).catch(() => {});
  }, []);

  const bundle = useMemo(() => buildBundle(packs), [packs]);

  const open = useCallback((b: number, c: number, v?: number) => {
    setBook(b);
    setChapter(c);
    setFocusVerse(v ?? null);
    setSelection(null);
    setAside(false);
    setView("read");
    setPalette(false);
    actions.openChapter(b, c);
  }, []);

  const goView = useCallback((v: View) => {
    setView(v);
    setPalette(false);
    if (v !== "read") {
      setSelection(null);
      setAside(false);
    }
  }, []);

  const gotoSearch = useCallback((q: string) => {
    setQuery(q);
    setView("search");
    setPalette(false);
    setSelection(null);
  }, []);

  const stepChapter = useCallback(
    (dir: 1 | -1) => {
      if (!meta) return;
      let b = book;
      let c = chapter + dir;
      if (c < 1) {
        if (b === 0) return;
        b -= 1;
        c = meta.books[b].chapters;
      } else if (c > meta.books[b].chapters) {
        if (b === meta.books.length - 1) return;
        b += 1;
        c = 1;
      }
      open(b, c);
    },
    [meta, book, chapter, open],
  );

  const bumpFont = useCallback((delta: number) => {
    const next = Math.min(28, Math.max(15, app.prefs.fontSize + delta));
    actions.setPrefs({ fontSize: next });
  }, [app.prefs.fontSize]);

  const cycleTheme = useCallback(() => {
    const i = THEME_ORDER.indexOf(app.prefs.theme);
    actions.setPrefs({ theme: THEME_ORDER[(i + 1) % THEME_ORDER.length] });
  }, [app.prefs.theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        goView("search");
      } else if (e.key === "Escape") {
        setPalette(false);
        setSelection(null);
        setAside(false);
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        stepChapter(1);
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        stepChapter(-1);
      } else if (mod && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        bumpFont(1);
      } else if (mod && e.key === "-") {
        e.preventDefault();
        bumpFont(-1);
      } else if (!typing && !mod && e.key === "j") {
        document.querySelector(".reader-scroll")?.scrollBy({ top: 220, behavior: "smooth" });
      } else if (!typing && !mod && e.key === "k") {
        document.querySelector(".reader-scroll")?.scrollBy({ top: -220, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepChapter, bumpFont, goView]);

  if (!booted || !meta) {
    return (
      <div className="splash">
        <div className="splash-mark">
          <Icon name="book" size={26} />
        </div>
        <div className="splash-title">Bibiliya Yera</div>
        <div className="splash-sub">Turatunganya ibyanditswe…</div>
      </div>
    );
  }

  const bookName = meta.books[book]?.name ?? "Itangiriro";

  return (
    <div className="app">
      <Sidebar
        meta={meta}
        view={view}
        place={{ book, chapter }}
        onOpen={open}
        onView={goView}
        onSearch={() => goView("search")}
        online={online}
      />

      <main className="main">
        <header className="topbar">
          <div className="crumb">
            <button className="crumb-btn" onClick={() => setPalette(true)} title="Hindura igitabo (Ctrl K)">
              <Icon name="book" size={15} />
              {bookName}
            </button>
            <span className="crumb-sep">·</span>
            <span className="crumb-chap">Igice {chapter}</span>
            <span className="crumb-hint">Alt ← → guhindura igice</span>
          </div>

          <div className="top-actions">
            <button className="icon-btn" title="Igice kibanza" onClick={() => stepChapter(-1)}>
              <Icon name="left" size={17} />
            </button>
            <button className="icon-btn" title="Igice gikurikira" onClick={() => stepChapter(1)}>
              <Icon name="right" size={17} />
            </button>
            <span className="divider" />
            <button className="icon-btn" title="Shakisha (Ctrl F)" onClick={() => goView("search")}>
              <Icon name="search" size={17} />
            </button>
            <button
              className="icon-btn"
              title="Ibara ry'urubuga"
              onClick={cycleTheme}
            >
              <Icon name={app.prefs.theme === "night" ? "moon" : "sun"} size={17} />
            </button>
            <div className="font-stepper" title="Ingano y'inyuguti (Ctrl +/-)">
              <button onClick={() => bumpFont(-1)}>A−</button>
              <button onClick={() => bumpFont(1)}>A+</button>
            </div>
          </div>
        </header>

        <div className="content">
          {view === "read" && (
            <Reader
              meta={meta}
              book={book}
              chapter={chapter}
              selection={selection}
              onSelect={setSelection}
              onNavigate={open}
              focusVerse={focusVerse}
              aside={aside}
              onAside={setAside}
              packNotes={bundle.notes}
            />
          )}
          {view === "home" && (
            <HomeView meta={meta} bundle={bundle} onOpen={open} onView={goView} />
          )}
          {view === "search" && (
            <SearchView meta={meta} query={query} onQuery={setQuery} onOpen={open} />
          )}
          {view === "plans" && <PlansView meta={meta} onOpen={open} />}
          {(view === "saved" || view === "notes") && (
            <SavedView
              meta={meta}
              initialTab={view === "notes" ? "notes" : "bookmarks"}
              onOpen={open}
            />
          )}
          {view === "online" && (
            <OnlineView packs={packs} onRefresh={refreshPacks} online={online} />
          )}
          {view === "support" && <SupportView online={online} />}
          {view === "settings" && <SettingsView meta={meta} />}
        </div>
      </main>

      {palette && (
        <CommandPalette
          meta={meta}
          onOpen={open}
          onView={goView}
          onSearch={gotoSearch}
          onClose={() => setPalette(false)}
        />
      )}
    </div>
  );
}
