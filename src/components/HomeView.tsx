import { useEffect, useMemo, useState } from "react";
import { api, type Meta } from "../lib/api";
import { buildPlans, planProgress, verseOfTheDay } from "../lib/plans";
import { useApp } from "../lib/store";
import { greeting, timeAgo, todayLabel } from "../lib/format";
import { todaysDevotional, type Bundle } from "../lib/content";
import { Icon } from "./Icon";
import type { View } from "./Sidebar";

interface Props {
  meta: Meta;
  bundle: Bundle;
  onOpen: (book: number, chapter: number, verse?: number) => void;
  onView: (v: View) => void;
}

export function HomeView({ meta, bundle, onOpen, onView }: Props) {
  const app = useApp();
  const [votd, setVotd] = useState<{ book: number; chapter: number; verse: number; text: string } | null>(null);
  const [peek, setPeek] = useState<string>("");

  const votdRef = useMemo(() => verseOfTheDay(meta.totalVerses, meta), [meta]);

  useEffect(() => {
    let alive = true;
    api
      .passage(votdRef.book, votdRef.chapter, votdRef.verse, votdRef.verse)
      .then((h) => alive && h[0] && setVotd({ ...votdRef, text: h[0].text }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [votdRef]);

  const lastRead = app.lastRead;
  useEffect(() => {
    if (!lastRead) return;
    let alive = true;
    api
      .passage(lastRead.book, lastRead.chapter, 1, 1)
      .then((h) => alive && h[0] && setPeek(h[0].text))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [lastRead]);

  const plans = buildPlans(meta);
  const activePlans = plans
    .map((p) => ({ plan: p, progress: planProgress(p, app.plans[p.id]) }))
    .filter((x) => app.plans[x.plan.id])
    .slice(0, 2);

  const devo = todaysDevotional(bundle);

  return (
    <div className="page home">
      <div className="home-top">
        <div className="home-intro">
          <div className="eyebrow">{todayLabel()}</div>
          <h1>
            {greeting()}. <br />
            <span className="h1-dim">Ijambo ry&apos;Imana ni urumuri</span>
          </h1>
          <p className="lede">
            Bibiliya Yera yose iri mu mudasobwa yawe. Soma igihe cyose, nta murandasi. Iyo
            ihari, yikura ibyongewe.
          </p>
          <div className="home-cta">
            <button
              className="btn primary"
              onClick={() =>
                lastRead ? onOpen(lastRead.book, lastRead.chapter) : onOpen(0, 1)
              }
            >
              <Icon name="book" size={17} />
              {lastRead ? "Komeza gusoma" : "Tangira gusoma"}
            </button>
            <button className="btn ghost" onClick={() => onView("plans")}>
              <Icon name="plan" size={17} />
              Gahunda zo gusoma
            </button>
          </div>
        </div>

        {lastRead && (
          <button className="continue-card" onClick={() => onOpen(lastRead.book, lastRead.chapter)}>
            <div className="cc-head">
              <span className="cc-eyebrow">Aho wageze</span>
              <span className="cc-time">{timeAgo(lastRead.at)}</span>
            </div>
            <strong>
              {meta.books[lastRead.book].name} {lastRead.chapter}
            </strong>
            {peek && <span className="cc-verse">“{peek}”</span>}
            <span className="cc-cta">
              Fungura <Icon name="right" size={15} />
            </span>
            <span className="cc-glow" />
          </button>
        )}
      </div>

      <div className="home-grid">
        <section className="card votd" onClick={() => onOpen(votdRef.book, votdRef.chapter, votdRef.verse)}>
          <div className="card-head">
            <span className="chip gold">
              <Icon name="sparkle" size={13} /> Umurongo w&apos;umunsi
            </span>
          </div>
          <blockquote>{votd?.text ?? "…"}</blockquote>
          <footer>
            <strong>
              {meta.books[votdRef.book].name} {votdRef.chapter}:{votdRef.verse}
            </strong>
            <span className="link">Soma igice <Icon name="right" size={13} /></span>
          </footer>
        </section>

        {devo && (
          <section className="card devo">
            <div className="card-head">
              <span className="chip">
                <Icon name="note" size={13} /> Icyo uri gusoma uyu munsi
              </span>
            </div>
            <h3>{devo.title}</h3>
            <p>{devo.body}</p>
            {devo.ref && (
              <footer>
                <button
                  className="link"
                  onClick={() => onOpen(devo.ref!.book, devo.ref!.chapter, devo.ref!.verse)}
                >
                  {meta.books[devo.ref.book].name} {devo.ref.chapter}
                  {devo.ref.verse ? `:${devo.ref.verse}` : ""} <Icon name="right" size={13} />
                </button>
              </footer>
            )}
          </section>
        )}

        <section className="card">
          <div className="card-head">
            <span className="chip">
              <Icon name="plan" size={13} /> Gahunda zawe
            </span>
            <button className="link" onClick={() => onView("plans")}>
              Zose <Icon name="right" size={13} />
            </button>
          </div>
          {activePlans.length === 0 ? (
            <p className="muted">
              Ntabwo urimo gahunda. Hitamo imwe ugende usoma Bibiliya yose mu mwaka, cyangwa
              Isezerano Rishya mu minsi 90.
            </p>
          ) : (
            <ul className="plan-mini">
              {activePlans.map(({ plan, progress }) => (
                <li key={plan.id}>
                  <div className="pm-top">
                    <strong>{plan.title}</strong>
                    <span>{progress.pct}%</span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${progress.pct}%` }} />
                  </div>
                  <div className="pm-bottom">
                    <span className="muted small">
                      {progress.done}/{progress.total} iminsi
                    </span>
                    {progress.nextDay && (
                      <button
                        className="link"
                        onClick={() =>
                          onOpen(
                            progress.nextDay!.chapters[0].book,
                            progress.nextDay!.chapters[0].chapter,
                          )
                        }
                      >
                        Komeza <Icon name="right" size={13} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {app.history.length > 1 && (
          <section className="card">
            <div className="card-head">
              <span className="chip">
                <Icon name="refresh" size={13} /> Wahereyeho
              </span>
            </div>
            <div className="recent-chips">
              {app.history.slice(1, 9).map((h, i) => (
                <button key={i} onClick={() => onOpen(h.book, h.chapter)}>
                  {meta.books[h.book].abbr} {h.chapter}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="home-foot">
        <span>
          {meta.totalChapters.toLocaleString("rw-RW")} ibice ·{" "}
          {meta.totalVerses.toLocaleString("rw-RW")} imirongo · {meta.translation.short}
        </span>
        <button className="link" onClick={() => onView("online")}>
          <Icon name="globe" size={13} /> Ibyongewe
        </button>
      </div>
    </div>
  );
}
