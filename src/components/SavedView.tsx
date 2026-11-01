import { useEffect, useMemo, useState } from "react";
import { api, type Meta } from "../lib/api";
import { actions, HIGHLIGHT_COLORS, useApp, verseKey } from "../lib/store";
import { timeAgo } from "../lib/format";
import { Icon } from "./Icon";

interface Props {
  meta: Meta;
  initialTab: "bookmarks" | "notes" | "highlights";
  onOpen: (book: number, chapter: number, verse?: number) => void;
}

type Ref = { book: number; chapter: number; verse: number };

function useTexts(refs: Ref[]) {
  const sig = refs.map((r) => verseKey(r.book, r.chapter, r.verse)).join("|");
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const list = refs.slice(0, 80);
    if (list.length === 0) {
      setMap({});
      return;
    }
    let alive = true;
    Promise.all(
      list.map((r) =>
        api
          .passage(r.book, r.chapter, r.verse, r.verse)
          .then((h) => [verseKey(r.book, r.chapter, r.verse), h[0]?.text ?? ""] as const)
          .catch(() => [verseKey(r.book, r.chapter, r.verse), ""] as const),
      ),
    ).then((rows) => {
      if (alive) setMap(Object.fromEntries(rows));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return map;
}

export function SavedView({ meta, initialTab, onOpen }: Props) {
  const app = useApp();
  const [tab, setTab] = useState(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  const bookmarkRefs = useMemo(
    () => app.bookmarks.map((b) => ({ book: b.book, chapter: b.chapter, verse: b.verse })),
    [app.bookmarks],
  );
  const noteRefs = useMemo(
    () =>
      Object.keys(app.notes).map((k) => {
        const [b, c, v] = k.split("-").map(Number);
        return { book: b, chapter: c, verse: v };
      }),
    [app.notes],
  );
  const hlRefs = useMemo(
    () =>
      Object.keys(app.highlights).map((k) => {
        const [b, c, v] = k.split("-").map(Number);
        return { book: b, chapter: c, verse: v };
      }),
    [app.highlights],
  );

  const texts = useTexts(tab === "bookmarks" ? bookmarkRefs : tab === "notes" ? noteRefs : hlRefs);
  const isDark = app.prefs.theme === "night";
  const label = (r: Ref) =>
    `${meta.books[r.book].name} ${r.chapter}:${r.verse}`;

  return (
    <div className="page saved">
      <div className="eyebrow">Aho wabitse</div>
      <h1>Ibyabitswe</h1>

      <div className="seg wide">
        <button className={tab === "bookmarks" ? "on" : ""} onClick={() => setTab("bookmarks")}>
          Ibyabitswe ({app.bookmarks.length})
        </button>
        <button className={tab === "notes" ? "on" : ""} onClick={() => setTab("notes")}>
          Inyandiko ({Object.keys(app.notes).length})
        </button>
        <button className={tab === "highlights" ? "on" : ""} onClick={() => setTab("highlights")}>
          Amarangi ({Object.keys(app.highlights).length})
        </button>
      </div>

      {tab === "bookmarks" && (
        <div className="saved-list">
          {app.bookmarks.length === 0 && (
            <div className="empty">
              <Icon name="bookmark" size={26} />
              <p>Nta murongo wabitswe.</p>
              <span className="muted small">
                Kanda umurongo mu isomo, hanyuma ukande akamenyetso k&apos;ububiko.
              </span>
            </div>
          )}
          {app.bookmarks.map((b) => {
            const k = verseKey(b.book, b.chapter, b.verse);
            return (
              <div key={k} className="saved-row">
                <button className="saved-main" onClick={() => onOpen(b.book, b.chapter, b.verse)}>
                  <span className="saved-ref">{label(b)}</span>
                  <span className="saved-text">{texts[k] ?? "…"}</span>
                  <span className="saved-time">{timeAgo(b.at)}</span>
                </button>
                <button
                  className="icon-btn"
                  title="Siba"
                  onClick={() => actions.toggleBookmark(b.book, b.chapter, b.verse)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "notes" && (
        <div className="saved-list">
          {noteRefs.length === 0 && (
            <div className="empty">
              <Icon name="note" size={26} />
              <p>Nta nyandiko ufite.</p>
              <span className="muted small">
                Kanda umurongo, hanyuma ukande “Inyandiko” wandike icyo ukuyemo.
              </span>
            </div>
          )}
          {noteRefs.map((r) => {
            const k = verseKey(r.book, r.chapter, r.verse);
            return (
              <div key={k} className="saved-row note-row">
                <button className="saved-main" onClick={() => onOpen(r.book, r.chapter, r.verse)}>
                  <span className="saved-ref">{label(r)}</span>
                  <span className="saved-text quote">{texts[k] ?? "…"}</span>
                  <span className="note-body">{app.notes[k]?.text}</span>
                  <span className="saved-time">
                    {app.notes[k] ? timeAgo(app.notes[k].at) : ""}
                  </span>
                </button>
                <button
                  className="icon-btn"
                  title="Siba"
                  onClick={() => actions.setNote(r.book, r.chapter, r.verse, "")}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "highlights" && (
        <div className="saved-list">
          {hlRefs.length === 0 && (
            <div className="empty">
              <Icon name="highlight" size={26} />
              <p>Nta murongo wamenyekanishijwe n&apos;ibara.</p>
            </div>
          )}
          {hlRefs.map((r) => {
            const k = verseKey(r.book, r.chapter, r.verse);
            const color = HIGHLIGHT_COLORS.find((c) => c.key === app.highlights[k]);
            return (
              <div key={k} className="saved-row">
                <button className="saved-main" onClick={() => onOpen(r.book, r.chapter, r.verse)}>
                  <span className="saved-ref">
                    <i
                      className="hl-dot"
                      style={{ background: color ? (isDark ? color.dark : color.light) : undefined }}
                    />
                    {label(r)}
                  </span>
                  <span className="saved-text">{texts[k] ?? "…"}</span>
                </button>
                <button
                  className="icon-btn"
                  title="Siba"
                  onClick={() => actions.setHighlight(r.book, r.chapter, r.verse, null)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
