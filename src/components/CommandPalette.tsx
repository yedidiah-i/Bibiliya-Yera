import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Meta } from "../lib/api";
import { Icon } from "./Icon";
import type { View } from "./Sidebar";

interface Props {
  meta: Meta;
  onOpen: (book: number, chapter: number) => void;
  onView: (v: View) => void;
  onSearch: (q: string) => void;
  onClose: () => void;
}

interface Item {
  id: string;
  label: string;
  sub?: string;
  icon: "book" | "search" | "home" | "plan" | "bookmark" | "note" | "globe" | "settings";
  run: () => void;
}

export function CommandPalette({ meta, onOpen, onView, onSearch, onClose }: Props) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo<Item[]>(() => {
    const needle = q.trim().toLowerCase();
    const books = meta.books
      .filter(
        (b) =>
          !needle ||
          b.name.toLowerCase().includes(needle) ||
          b.abbr.toLowerCase().includes(needle) ||
          b.id.toLowerCase() === needle,
      )
      .slice(0, 10)
      .map<Item>((b) => ({
        id: `book-${b.index}`,
        label: b.name,
        sub: `${b.chapters} ibice · ${b.testament === "OT" ? "Isezerano rya Kera" : "Isezerano Rishya"}`,
        icon: "book",
        run: () => onOpen(b.index, 1),
      }));

    const quickAll: Item[] = [
      { id: "v-home", label: "Ahabanza", icon: "home", run: () => onView("home") },
      { id: "v-plans", label: "Gahunda zo gusoma", icon: "plan", run: () => onView("plans") },
      { id: "v-saved", label: "Ibyabitswe", icon: "bookmark", run: () => onView("saved") },
      { id: "v-notes", label: "Inyandiko zanjye", icon: "note", run: () => onView("notes") },
      { id: "v-online", label: "Ibyongewe", icon: "globe", run: () => onView("online") },
      { id: "v-settings", label: "Igenamiterere", icon: "settings", run: () => onView("settings") },
    ];
    const quick = quickAll.filter((i) => !needle || i.label.toLowerCase().includes(needle));

    const search: Item[] = needle
      ? [
          {
            id: "search",
            label: `Shakisha “${q.trim()}” muri Bibiliya yose`,
            sub: "Kanda Enter",
            icon: "search",
            run: () => onSearch(q.trim()),
          },
        ]
      : [];

    return [...search, ...books, ...quick];
  }, [q, meta, onOpen, onView, onSearch]);

  useEffect(() => setIdx(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[idx]?.run();
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Igitabo, igice cyangwa ijambo…"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {items.length === 0 && <div className="palette-empty">Nta kintu kibonetse</div>}
          {items.map((it, i) => (
            <button
              key={it.id}
              data-i={i}
              className={`palette-item ${i === idx ? "on" : ""}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => {
                it.run();
                onClose();
              }}
            >
              <Icon name={it.icon} size={16} />
              <span className="pi-label">{it.label}</span>
              {it.sub && <span className="pi-sub">{it.sub}</span>}
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> guhitamo
          </span>
          <span>
            <kbd>Enter</kbd> gufungura
          </span>
        </div>
      </div>
    </div>
  );
}
