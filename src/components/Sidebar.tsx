import { useState } from "react";
import type { Meta } from "../lib/api";
import { Icon } from "./Icon";

export type View = "home" | "read" | "search" | "plans" | "saved" | "notes" | "online" | "support" | "settings";

interface Props {
  meta: Meta;
  view: View;
  place: { book: number; chapter: number };
  onOpen: (book: number, chapter: number) => void;
  onView: (v: View) => void;
  onSearch: () => void;
  online: boolean;
}

export function Sidebar({ meta, view, place, onOpen, onView, onSearch, online }: Props) {
  const [tab, setTab] = useState<"all" | "OT" | "NT">("all");
  const [expanded, setExpanded] = useState<number | null>(place.book);
  const [filter, setFilter] = useState("");

  const books = meta.books.filter(
    (b) =>
      (tab === "all" || b.testament === tab) &&
      (filter.trim() === "" ||
        b.name.toLowerCase().includes(filter.toLowerCase()) ||
        b.abbr.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="book" size={17} />
        </div>
        <div className="brand-text">
          <strong>Bibiliya Yera</strong>
          <span>BYSB · {meta.translation.year}</span>
        </div>
      </div>

      <button className="search-trigger" onClick={onSearch}>
        <Icon name="search" size={16} />
        <span>Shakisha mu Byanditswe…</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="nav">
        <NavItem icon="home" label="Ahabanza" active={view === "home"} onClick={() => onView("home")} />
        <NavItem
          icon="book"
          label="Soma"
          active={view === "read"}
          onClick={() => onView("read")}
        />
        <NavItem
          icon="plan"
          label="Gahunda zo gusoma"
          active={view === "plans"}
          onClick={() => onView("plans")}
        />
        <NavItem
          icon="bookmark"
          label="Ibyabitswe"
          active={view === "saved"}
          onClick={() => onView("saved")}
        />
        <NavItem
          icon="note"
          label="Inyandiko zanjye"
          active={view === "notes"}
          onClick={() => onView("notes")}
        />
        <NavItem
          icon="globe"
          label="Ibyongewe"
          active={view === "online"}
          onClick={() => onView("online")}
        />
        <NavItem
          icon="info"
          label="Ubufasha"
          active={view === "support"}
          onClick={() => onView("support")}
        />
      </nav>

      <div className="books-head">
        <div className="books-title">
          <span>Ibitabo</span>
          <div className="seg small">
            <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
              Byose
            </button>
            <button className={tab === "OT" ? "on" : ""} onClick={() => setTab("OT")}>
              Kera
            </button>
            <button className={tab === "NT" ? "on" : ""} onClick={() => setTab("NT")}>
              Rishya
            </button>
          </div>
        </div>
        <div className="book-filter">
          <Icon name="search" size={14} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Shakisha igitabo…"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="book-scroll">
        {books.map((b) => {
          const open = expanded === b.index;
          return (
            <div key={b.id} className={`book-row ${open ? "open" : ""}`}>
              <button
                className={`book-btn ${place.book === b.index && view === "read" ? "current" : ""}`}
                onClick={() => setExpanded(open ? null : b.index)}
              >
                <span className="book-abbr">{b.abbr}</span>
                <span className="book-name">{b.name}</span>
                <span className="book-count">{b.chapters}</span>
                <Icon name="chevron" size={14} className="book-caret" />
              </button>
              {open && (
                <div className="chapter-grid">
                  {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => (
                    <button
                      key={c}
                      className={
                        place.book === b.index && place.chapter === c && view === "read"
                          ? "chap on"
                          : "chap"
                      }
                      onClick={() => onOpen(b.index, c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {books.length === 0 && <div className="empty-small">Nta gitabo kibonetse</div>}
      </div>

      <div className="sidebar-foot">
        <button className="foot-btn" onClick={() => onView("settings")}>
          <Icon name="settings" size={15} />
          Igenamiterere
        </button>
        <span className={`net ${online ? "on" : ""}`}>
          <i /> {online ? "Kuri murandasi" : "Nta murandasi"}
        </span>
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: "home" | "book" | "plan" | "bookmark" | "note" | "globe" | "info";
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <Icon name={icon} size={17} />
      <span>{label}</span>
    </button>
  );
}
