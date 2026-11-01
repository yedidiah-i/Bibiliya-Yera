import { useEffect, useRef, useState } from "react";
import { api, type Meta, type SearchPage } from "../lib/api";
import { Icon } from "./Icon";

interface Props {
  meta: Meta;
  query: string;
  onQuery: (q: string) => void;
  onOpen: (book: number, chapter: number, verse?: number) => void;
}

const EMPTY: SearchPage = { total: 0, capped: false, hits: [] };

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(query.trim())})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i}>{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function SearchView({ meta, query, onQuery, onOpen }: Props) {
  const [scope, setScope] = useState<"all" | "OT" | "NT">("all");
  const [page, setPage] = useState<SearchPage>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPage(EMPTY);
      setBusy(false);
      return;
    }
    const id = ++runId.current;
    setBusy(true);
    const t = window.setTimeout(() => {
      api
        .search(q, scope === "all" ? null : scope, 0, 80)
        .then((r) => {
          if (runId.current !== id) return;
          setPage(r);
          setBusy(false);
        })
        .catch(() => {
          if (runId.current === id) setBusy(false);
        });
    }, 140);
    return () => window.clearTimeout(t);
  }, [query, scope]);

  const loadMore = async () => {
    const q = query.trim();
    if (!q || more) return;
    setMore(true);
    try {
      const next = await api.search(q, scope === "all" ? null : scope, page.hits.length, 80);
      setPage((p) => ({
        total: next.total,
        capped: next.capped,
        hits: [...p.hits, ...next.hits],
      }));
    } finally {
      setMore(false);
    }
  };

  return (
    <div className="page search-page">
      <div className="search-hero">
        <div className="eyebrow">Gushakisha mu Byanditswe byose</div>
        <h1>Shakisha ijambo</h1>
        <div className="search-box">
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Urugero: urukundo, kwizera, Imana…"
            spellCheck={false}
          />
          {query && (
            <button className="icon-btn" onClick={() => onQuery("")} title="Siba">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <div className="search-meta">
          <div className="seg">
            <button className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>
              Byose
            </button>
            <button className={scope === "OT" ? "on" : ""} onClick={() => setScope("OT")}>
              Isezerano rya Kera
            </button>
            <button className={scope === "NT" ? "on" : ""} onClick={() => setScope("NT")}>
              Isezerano Rishya
            </button>
          </div>
          {query.trim() && !busy && (
            <span className="muted">
              {page.total.toLocaleString("rw-RW")}
              {page.capped ? "+" : ""} ibisubizo
            </span>
          )}
          {busy && <span className="muted">Turashakisha…</span>}
        </div>
      </div>

      {!query.trim() ? (
        <div className="search-hint">
          <p className="muted">
            Andika ijambo cyangwa interuro. Gushakisha bikorwa mu mirongo {meta.totalVerses.toLocaleString("rw-RW")}{" "}
            yose ya Bibiliya Yera, nta murandasi ukenewe.
          </p>
          <div className="suggest">
            {["urukundo", "kwizera", "Imana", "amahoro", "imbabazi", "ubwenge"].map((s) => (
              <button key={s} onClick={() => onQuery(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="results">
          {page.hits.length === 0 && !busy && (
            <div className="empty">
              <Icon name="search" size={28} />
              <p>Nta bisubizo byabonetse kuri “{query}”.</p>
              <span className="muted small">Gerageza ijambo ribaho cyangwa irindi.</span>
            </div>
          )}
          {page.hits.map((h, i) => (
            <button
              key={`${h.book}-${h.chapter}-${h.verse}-${i}`}
              className="result"
              onClick={() => onOpen(h.book, h.chapter, h.verse)}
            >
              <span className="result-ref">
                {meta.books[h.book].name} {h.chapter}:{h.verse}
              </span>
              <span className="result-text">
                <Highlighted text={h.text} query={query} />
              </span>
            </button>
          ))}
          {page.hits.length > 0 && page.hits.length < page.total && !page.capped && (
            <button className="btn ghost load-more" onClick={loadMore} disabled={more}>
              {more ? "Turazana…" : "Erekana ibindi"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
