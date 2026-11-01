import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { api, type CrossRef, type Meta } from "../lib/api";
import { actions, HIGHLIGHT_COLORS, useApp, verseKey } from "../lib/store";
import { Icon } from "./Icon";

export interface Selection {
  start: number;
  end: number;
}

interface Props {
  meta: Meta;
  book: number;
  chapter: number;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onNavigate: (book: number, chapter: number, verse?: number) => void;
  focusVerse: number | null;
  aside: boolean;
  onAside: (open: boolean) => void;
  packNotes: Record<string, string>;
}

/* Small LRU so chapter back/forward is instant and memory stays flat. */
const cache = new Map<string, string[]>();
function cacheSet(key: string, value: string[]) {
  if (cache.size > 16) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, value);
}

export function Reader({
  meta,
  book,
  chapter,
  selection,
  onSelect,
  onNavigate,
  focusVerse,
  aside,
  onAside,
  packNotes,
}: Props) {
  const app = useApp();
  const [verses, setVerses] = useState<string[]>(() => cache.get(`${book}:${chapter}`) ?? []);
  const [loading, setLoading] = useState(verses.length === 0);
  const [xrefs, setXrefs] = useState<CrossRef[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const bookMeta = meta.books[book];
  const key = `${book}:${chapter}`;

  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setVerses(cached);
      setLoading(false);
    } else {
      setLoading(true);
      let alive = true;
      api
        .chapter(book, chapter)
        .then((v) => {
          if (!alive) return;
          cacheSet(key, v);
          setVerses(v);
          setLoading(false);
        })
        .catch(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }
  }, [book, chapter, key]);

  // Scroll behaviour: jump to a requested verse, otherwise go back to the top.
  useEffect(() => {
    if (loading) return;
    if (focusVerse) {
      const el = bodyRef.current?.querySelector<HTMLElement>(`[data-v="${focusVerse}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        return;
      }
    }
    bodyRef.current?.scrollTo({ top: 0 });
  }, [loading, focusVerse, book, chapter]);

  const selKey = selection ? verseKey(book, chapter, selection.start) : null;
  const selectedText = useMemo(() => {
    if (!selection || verses.length === 0) return "";
    return verses
      .slice(selection.start - 1, selection.end)
      .map((t, i) => `${selection.start + i} ${t}`)
      .join("\n");
  }, [selection, verses]);

  // Cross references for the anchor verse of the selection.
  useEffect(() => {
    if (!selection) {
      setXrefs([]);
      return;
    }
    let alive = true;
    api
      .xrefs(book, chapter, selection.start)
      .then((r) => alive && setXrefs(r))
      .catch(() => alive && setXrefs([]));
    return () => {
      alive = false;
    };
  }, [book, chapter, selection]);

  useEffect(() => {
    setNoteDraft(selKey ? (app.notes[selKey]?.text ?? "") : "");
  }, [selKey, app.notes]);

  const prev = chapter > 1 ? { c: chapter - 1 } : book > 0 ? { b: book - 1, c: meta.books[book - 1].chapters } : null;
  const next =
    chapter < bookMeta.chapters
      ? { b: book, c: chapter + 1 }
      : book < meta.books.length - 1
        ? { b: book + 1, c: 1 }
        : null;

  const isDark = app.prefs.theme === "night";
  const hlColor = (keyName: string) => {
    const c = HIGHLIGHT_COLORS.find((x) => x.key === keyName);
    return c ? (isDark ? c.dark : c.light) : undefined;
  };

  const bookmarked =
    selection && app.bookmarks.some(
      (b) => b.book === book && b.chapter === chapter && b.verse === selection.start,
    );

  const label = `${bookMeta.name} ${chapter}:${selection?.start}${
    selection && selection.end !== selection.start ? `-${selection.end}` : ""
  }`;

  const handleClick = (v: number, shift: boolean) => {
    if (shift && selection) {
      onSelect({ start: Math.min(selection.start, v), end: Math.max(selection.start, v) });
    } else if (selection && selection.start === v && selection.end === v) {
      onSelect(null);
    } else {
      onSelect({ start: v, end: v });
    }
  };

  const copy = async () => {
    const text = `${label} (Bibiliya Yera)\n${selectedText}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  };

  return (
    <div className="reader-wrap">
      <div className="reader-scroll" ref={bodyRef}>
        <div className="reader" style={{ "--read-width": `${app.prefs.width}px` } as CSSProperties}>
          <div className="chapter-head">
            <div className="eyebrow">{bookMeta.name}</div>
            <h1>Igice {chapter}</h1>
            <div className="head-meta">
              {bookMeta.verses[chapter - 1]} imirongo
              {bookMeta.testament === "NT" ? " · Isezerano Rishya" : " · Isezerano rya Kera"}
            </div>
          </div>

          {loading ? (
            <div className="skeleton">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="sk-line" style={{ width: `${92 - (i % 4) * 9}%` }} />
              ))}
            </div>
          ) : (
            <div
              className={`verses ${app.prefs.paragraph ? "flow" : "lines"}`}
              style={{
                fontSize: `${app.prefs.fontSize}px`,
                lineHeight: app.prefs.lineHeight,
                fontFamily: app.prefs.serif
                  ? '"Palatino Linotype", "Book Antiqua", Georgia, serif'
                  : '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
              }}
            >
              {verses.map((text, i) => {
                const v = i + 1;
                const k = verseKey(book, chapter, v);
                const hl = app.highlights[k];
                const hasNote = Boolean(app.notes[k]);
                const selected =
                  selection && v >= selection.start && v <= selection.end;
                const Tag = app.prefs.paragraph ? "span" : "div";
                return (
                  <Tag
                    key={v}
                    data-v={v}
                    className={`v ${selected ? "sel" : ""} ${hasNote ? "has-note" : ""}`}
                    data-hl={hl ? "1" : undefined}
                    style={hl ? ({ "--hl": hlColor(hl) } as CSSProperties) : undefined}
                    onClick={(e) => handleClick(v, e.shiftKey)}
                  >
                    {app.prefs.verseNumbers && (
                      <sup className="vn" aria-hidden="true">
                        {v}
                      </sup>
                    )}
                    {text}
                    {app.prefs.paragraph ? " " : null}
                  </Tag>
                );
              })}
            </div>
          )}

          <div className="chap-nav">
            {prev ? (
              <button
                className="chap-link"
                onClick={() => onNavigate(prev.b ?? book, prev.c)}
              >
                <Icon name="left" size={16} />
                <span>
                  <small>{meta.books[prev.b ?? book].name}</small>
                  Igice {prev.c}
                </span>
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button
                className="chap-link right"
                onClick={() => onNavigate(next.b ?? book, next.c)}
              >
                <span>
                  <small>{meta.books[next.b ?? book].name}</small>
                  Igice {next.c}
                </span>
                <Icon name="right" size={16} />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      {selection && (
        <div className="actionbar">
          <span className="ab-label">{label}</span>
          <div className="ab-swatches">
            {HIGHLIGHT_COLORS.map((c) => {
              const active = app.highlights[verseKey(book, chapter, selection.start)] === c.key;
              return (
                <button
                  key={c.key}
                  className={`swatch ${active ? "on" : ""}`}
                  style={{ background: isDark ? c.dark : c.light }}
                  title="Shyira ibara ku mirongo yose watoranyije"
                  onClick={() =>
                    actions.setHighlightRange(
                      book,
                      chapter,
                      selection.start,
                      selection.end,
                      active ? null : c.key,
                    )
                  }
                />
              );
            })}
          </div>
          <div className="ab-actions">
            <button
              className={bookmarked ? "on" : ""}
              title="Bika umurongo"
              onClick={() => actions.toggleBookmark(book, chapter, selection.start)}
            >
              <Icon name="bookmark" size={16} />
            </button>
            <button
              className={aside ? "on" : ""}
              title="Ibisobanuro n'imirongo ihuye"
              onClick={() => {
                onAside(!aside);
                setTimeout(() => noteRef.current?.focus(), 60);
              }}
            >
              <Icon name="note" size={16} />
            </button>
            <button title="Koporora" onClick={copy}>
              <Icon name="copy" size={16} />
            </button>
            <button title="Funga" onClick={() => onSelect(null)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {aside && selection && (
        <aside className="aside">
          <header>
            <div>
              <div className="eyebrow">{bookMeta.name}</div>
              <strong>
                Igice {chapter}:{selection.start}
                {selection.end !== selection.start ? `-${selection.end}` : ""}
              </strong>
            </div>
            <button className="icon-btn" onClick={() => onAside(false)} title="Funga">
              <Icon name="close" size={16} />
            </button>
          </header>

          <div className="aside-scroll">
            <section>
              <div className="aside-title">Umurongo</div>
              <p className="aside-verse">{selectedText}</p>
            </section>

            <section>
              <div className="aside-title">
                <Icon name="link" size={14} /> Imirongo ihuye
              </div>
              {xrefs.length === 0 ? (
                <p className="muted small">Nta mirongo ihuye yabonetse kuri uyu murongo.</p>
              ) : (
                <ul className="xref-list">
                  {xrefs.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => onNavigate(r.book, r.chapter, r.verse)}>
                        <span className="xref-label">{r.label}</span>
                        <span className="xref-text">{r.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {packNotes[verseKey(book, chapter, selection.start)] && (
              <section>
                <div className="aside-title">
                  <Icon name="sparkle" size={14} /> Ibisobanuro
                </div>
                <p className="study-note">
                  {packNotes[verseKey(book, chapter, selection.start)]}
                </p>
              </section>
            )}

            <section>
              <div className="aside-title">
                <Icon name="note" size={14} /> Inyandiko yawe
              </div>
              <textarea
                ref={noteRef}
                className="note-input"
                value={noteDraft}
                placeholder="Andika icyo ukuyemo kuri uyu murongo…"
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={() => actions.setNote(book, chapter, selection.start, noteDraft)}
                rows={4}
              />
              <div className="note-actions">
                <button
                  className="btn primary small"
                  onClick={() => actions.setNote(book, chapter, selection.start, noteDraft)}
                >
                  Bika inyandiko
                </button>
                {app.notes[verseKey(book, chapter, selection.start)] && (
                  <button
                    className="btn ghost small"
                    onClick={() => {
                      setNoteDraft("");
                      actions.setNote(book, chapter, selection.start, "");
                    }}
                  >
                    Siba
                  </button>
                )}
              </div>
            </section>
          </div>
        </aside>
      )}
    </div>
  );
}
