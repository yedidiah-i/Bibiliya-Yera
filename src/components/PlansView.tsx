import { useMemo, useState } from "react";
import type { Meta } from "../lib/api";
import { buildPlans, planProgress } from "../lib/plans";
import { actions, useApp } from "../lib/store";
import { Icon } from "./Icon";

interface Props {
  meta: Meta;
  onOpen: (book: number, chapter: number, verse?: number) => void;
}

export function PlansView({ meta, onOpen }: Props) {
  const app = useApp();
  const plans = useMemo(() => buildPlans(meta), [meta]);
  const [openId, setOpenId] = useState<string | null>(null);
  const plan = plans.find((p) => p.id === openId) ?? null;

  if (plan) {
    const progress = planProgress(plan, app.plans[plan.id]?.done ? app.plans[plan.id] : undefined);
    return (
      <div className="page plans">
        <button className="back" onClick={() => setOpenId(null)}>
          <Icon name="left" size={16} /> Gahunda zose
        </button>
        <header className="plan-head">
          <div>
            <div className="eyebrow">{plan.subtitle}</div>
            <h1>{plan.title}</h1>
          </div>
          <div className="plan-ring">
            <svg viewBox="0 0 44 44" width="56" height="56">
              <circle cx="22" cy="22" r="18" className="ring-bg" />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="ring-fg"
                strokeDasharray={`${(progress.pct / 100) * 113} 113`}
              />
            </svg>
            <span>{progress.pct}%</span>
          </div>
        </header>

        {progress.nextDay && (
          <div className="next-day">
            <div>
              <div className="eyebrow">Umunsi ukurikira</div>
              <strong>Umunsi wa {progress.nextDay.day}</strong>
              <div className="muted small">
                {progress.nextDay.chapters
                  .map((c) => `${meta.books[c.book].name} ${c.chapter}`)
                  .join(" · ")}
              </div>
            </div>
            <button
              className="btn primary"
              onClick={() =>
                onOpen(progress.nextDay!.chapters[0].book, progress.nextDay!.chapters[0].chapter)
              }
            >
              Soma uyu munsi
            </button>
          </div>
        )}

        <div className="days">
          {plan.days.map((d) => {
            const done = app.plans[plan.id]?.done.includes(d.day);
            return (
              <div key={d.day} className={`day ${done ? "done" : ""}`}>
                <button
                  className={`day-check ${done ? "on" : ""}`}
                  onClick={() => actions.togglePlanDay(plan.id, d.day)}
                  title={done ? "Kuvana ku rutonde" : "Menyekanisha ko wabisomye"}
                >
                  {done ? <Icon name="check" size={13} /> : <span />}
                </button>
                <span className="day-no">Umunsi {d.day}</span>
                <div className="day-chapters">
                  {d.chapters.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => onOpen(c.book, c.chapter)}
                      title={`${meta.books[c.book].name} ${c.chapter}`}
                    >
                      {meta.books[c.book].abbr}&nbsp;{c.chapter}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page plans">
      <div className="eyebrow">Gahunda zo gusoma</div>
      <h1>Hitamo urugendo rwawe</h1>
      <p className="lede">
        Gahunda zikoreshwa nta murandasi. Aho ugeze kubikwa muri iyi mudasobwa, bityo ushobora
        guhagarara ukanakomeza igihe icyo ari cyo.
      </p>

      <div className="plan-cards">
        {plans.map((p) => {
          const progress = planProgress(p, app.plans[p.id]);
          const started = Boolean(app.plans[p.id]);
          return (
            <div key={p.id} className="plan-card">
              <div className="plan-card-top">
                <span className="chip">{p.days.length} iminsi</span>
                {started && <span className="chip gold">{progress.pct}%</span>}
              </div>
              <h3>{p.title}</h3>
              <p className="muted">{p.subtitle}</p>
              <div className="bar">
                <i style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="plan-card-actions">
                <button
                  className="btn ghost small"
                  onClick={() => {
                    actions.startPlan(p.id);
                    setOpenId(p.id);
                  }}
                >
                  {started ? "Reba gahunda" : "Tangira"}
                </button>
                {progress.nextDay && (
                  <button
                    className="link"
                    onClick={() =>
                      onOpen(progress.nextDay!.chapters[0].book, progress.nextDay!.chapters[0].chapter)
                    }
                  >
                    Uyu munsi <Icon name="right" size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
