import { useState } from "react";
import { api, type Meta } from "../lib/api";
import { actions, defaultState, useApp, type AppState, type Theme } from "../lib/store";
import { Icon } from "./Icon";

const THEMES: { key: Theme; label: string; hint: string }[] = [
  { key: "light", label: "Umucyo", hint: "Impapuro zera" },
  { key: "sepia", label: "Sepia", hint: "Ijoro ryera" },
  { key: "night", label: "Ijoro", hint: "Umwijima woroheje" },
];

export function SettingsView({ meta }: { meta: Meta }) {
  const app = useApp();
  const p = app.prefs;
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const exportBackup = async () => {
    setMsg(null);
    setErr(null);
    try {
      const path = await api.saveDialog("bibiliya-yera-backup.json");
      if (!path) return;
      await api.backupExport(path);
      setMsg(`Backup yabitswe: ${path}`);
    } catch (e) {
      setErr(String(e));
    }
  };

  const importBackup = async () => {
    setMsg(null);
    setErr(null);
    try {
      const picked = await api.openDialog();
      if (!picked || Array.isArray(picked)) return;
      const raw = await api.backupImport(picked);
      const parsed = JSON.parse(raw) as AppState;
      actions.replaceState({ ...defaultState(), ...parsed } as AppState);
      setMsg("Backup yagarutswe. Inyandiko, ibyabitswe na gahunda byose birahari.");
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <div className="page settings">
      <div className="eyebrow">Igenamiterere</div>
      <h1>Uko usoma</h1>

      <section className="card">
        <div className="card-head">
          <span className="chip">
            <Icon name="sun" size={13} /> Ibara ry&apos;urubuga
          </span>
        </div>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`theme-card ${p.theme === t.key ? "on" : ""}`}
              onClick={() => actions.setPrefs({ theme: t.key })}
            >
              <span className={`swatch-big ${t.key}`} />
              <strong>{t.label}</strong>
              <span className="muted small">{t.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <span className="chip">Inyuguti</span>
          <button
            className="link"
            onClick={() =>
              actions.setPrefs({
                fontSize: 19,
                lineHeight: 1.72,
                width: 700,
                paragraph: true,
                verseNumbers: true,
                serif: true,
              })
            }
          >
            Garuka ku bisanzwe
          </button>
        </div>

        <div className="setting-row">
          <label>Ingano y&apos;inyuguti</label>
          <div className="range">
            <input
              type="range"
              min={15}
              max={28}
              step={1}
              value={p.fontSize}
              onChange={(e) => actions.setPrefs({ fontSize: Number(e.target.value) })}
            />
            <span>{p.fontSize}px</span>
          </div>
        </div>

        <div className="setting-row">
          <label>Intera y&apos;imirongo</label>
          <div className="range">
            <input
              type="range"
              min={1.4}
              max={2.1}
              step={0.02}
              value={p.lineHeight}
              onChange={(e) => actions.setPrefs({ lineHeight: Number(e.target.value) })}
            />
            <span>{p.lineHeight.toFixed(2)}</span>
          </div>
        </div>

        <div className="setting-row">
          <label>Ubugari bw&apos;urupapuro</label>
          <div className="range">
            <input
              type="range"
              min={520}
              max={860}
              step={10}
              value={p.width}
              onChange={(e) => actions.setPrefs({ width: Number(e.target.value) })}
            />
            <span>{p.width}px</span>
          </div>
        </div>

        <div className="setting-row">
          <label>Imiterere</label>
          <div className="seg">
            <button className={p.paragraph ? "on" : ""} onClick={() => actions.setPrefs({ paragraph: true })}>
              Inyandiko ikurikiranye
            </button>
            <button className={!p.paragraph ? "on" : ""} onClick={() => actions.setPrefs({ paragraph: false })}>
              Umurongo ku murongo
            </button>
          </div>
        </div>

        <div className="setting-row">
          <label>Imirongo</label>
          <div className="seg">
            <button className={p.verseNumbers ? "on" : ""} onClick={() => actions.setPrefs({ verseNumbers: true })}>
              Erekana nimero
            </button>
            <button className={!p.verseNumbers ? "on" : ""} onClick={() => actions.setPrefs({ verseNumbers: false })}>
              Fihisha
            </button>
          </div>
        </div>

        <div className="setting-row">
          <label>Ubwoko bw&apos;inyuguti</label>
          <div className="seg">
            <button className={p.serif ? "on" : ""} onClick={() => actions.setPrefs({ serif: true })}>
              Serif
            </button>
            <button className={!p.serif ? "on" : ""} onClick={() => actions.setPrefs({ serif: false })}>
              Sans
            </button>
          </div>
        </div>

        <div
          className="type-preview"
          style={{
            fontSize: `${p.fontSize * 0.85}px`,
            lineHeight: p.lineHeight,
            fontFamily: p.serif
              ? '"Palatino Linotype", "Book Antiqua", Georgia, serif'
              : '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
          }}
        >
          <sup className="vn">1</sup>Mbere na mbere Imana yaremye ijuru n&apos;isi.
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <span className="chip">
            <Icon name="download" size={13} /> Kubika n&apos;kugarura
          </span>
        </div>
        <p className="muted small">
          Bika inyandiko zawe, ibyabitswe, amarangi na gahunda mu dosiye imwe. Ushobora kuyijyana
          kuri mudasobwa indi.
        </p>
        <div className="row-btns">
          <button className="btn ghost small" onClick={exportBackup}>
            Bika backup
          </button>
          <button className="btn ghost small" onClick={importBackup}>
            Garura backup
          </button>
        </div>
        {msg && <div className="notice ok">{msg}</div>}
        {err && <div className="notice err">{err}</div>}
      </section>

      <section className="card about">
        <div className="card-head">
          <span className="chip">
            <Icon name="info" size={13} /> Kuri iyi porogaramu
          </span>
        </div>
        <dl>
          <div>
            <dt>Ibyanditswe</dt>
            <dd>
              {meta.translation.name} ({meta.translation.short}) · {meta.translation.year}
            </dd>
          </div>
          <div>
            <dt>Uwabitangaje</dt>
            <dd>{meta.translation.publisher}</dd>
          </div>
          <div>
            <dt>Ingano</dt>
            <dd>
              {meta.totalChapters.toLocaleString("rw-RW")} ibice ·{" "}
              {meta.totalVerses.toLocaleString("rw-RW")} imirongo
            </dd>
          </div>
          <div>
            <dt>Verisiyo ya porogaramu</dt>
            <dd>1.0.0 · Windows</dd>
          </div>
        </dl>
        <p className="muted small">
          Ibyanditswe bya Bibiliya Yera ni umutungo wa Bible Society of Rwanda. Iyi porogaramu
          ibika byose mu mudasobwa yawe.
        </p>
      </section>
    </div>
  );
}
