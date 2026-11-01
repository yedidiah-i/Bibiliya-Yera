import { useEffect, useState } from "react";
import { api, type Meta } from "../lib/api";
import { actions, defaultState, useApp, type AppState, type Theme } from "../lib/store";
import { Icon } from "./Icon";

const THEMES: { key: Theme; label: string; hint: string }[] = [
  { key: "light", label: "Umucyo", hint: "Impapuro zera" },
  { key: "sepia", label: "Sepia", hint: "Ijoro ryera" },
  { key: "night", label: "Ijoro", hint: "Dark mode" },
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

      <section className="card">
        <div className="card-head">
          <span className="chip">
            <Icon name="note" size={13} /> Ubufasha
          </span>
        </div>
        <p className="muted small">
          Niba ufite ikibazo cyangwa igitekerezo, wandike hano. Ubutumwa buzakoherezwa kuri
          <strong> futureksmeyedidiah@gmail.com</strong> iyo murandasi ihari. Niba nta murandasi,
          buzigumishwa kandi buzoherezwa iyo murandasi igarutse.
        </p>
        <SupportForm />
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

function SupportForm() {
  const app = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

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

  useEffect(() => {
    const queue = app.support?.queue ?? [];
    const pending = queue.filter((t) => !t.sent);
    if (pending.length > 0 && online) {
      pending.forEach((t) => {
        const body = [
          `Izina: ${t.name || "-"}`,
          `Email: ${t.email || "-"}`,
          ``,
          t.message,
          ``,
          `---`,
          `Yoherejwe na Bibiliya Yera (${new Date(t.createdAt).toISOString()})`,
        ].join("\n");
        api
          .sendSupportEmail("futureksmeyedidiah@gmail.com", t.subject || "Ubufasha - Bibiliya Yera", body)
          .then(() => {
            actions.markSupportSent(t.id);
          })
          .catch(() => {});
      });
    }
  }, [online, app.support?.queue]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setErr(null);
    if (!subject.trim() || !message.trim()) {
      setErr("Andika umutwe n'ubutumwa.");
      return;
    }
    const ticket = actions.addSupportTicket({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
    });
    if (online) {
      const body = [
        `Izina: ${name.trim() || "-"}`,
        `Email: ${email.trim() || "-"}`,
        ``,
        message.trim(),
        ``,
        `---`,
        `Yoherejwe na Bibiliya Yera (${new Date(ticket.createdAt).toISOString()})`,
      ].join("\n");
      try {
        await api.sendSupportEmail(
          "futureksmeyedidiah@gmail.com",
          subject.trim(),
          body,
        );
        actions.markSupportSent(ticket.id);
        setStatus("Ubutumwa bwoherejwe. Murakoze!");
      } catch {
        setStatus("Ubutumwa bubitswe. Buzoherezwa iyo murandasi igarutse.");
      }
    } else {
      setStatus("Nta murandasi. Ubutumwa bubitswe. Buzoherezwa iyo murandasi igarutse.");
    }
    setSubject("");
    setMessage("");
  };

  const pending = (app.support?.queue ?? []).filter((t) => !t.sent);

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <div className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input
          className="input"
          placeholder="Izina (bitari ngombwa)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Email (bitari ngombwa)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <input
        className="input"
        placeholder="Umutwe w'ikibazo"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />
      <textarea
        className="input"
        placeholder="Sobanura ikibazo cyangwa igitekerezo cyawe..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        required
        style={{ resize: "vertical" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn" type="submit">
          Ohereza
        </button>
        <span className="muted small">
          {online ? "Kuri murandasi" : "Nta murandasi - buzoherezwa nyuma"}
        </span>
        {pending.length > 0 && (
          <span className="muted small">
            {pending.length} butumwa butegereje koherezwa
          </span>
        )}
      </div>
      {status && <div className="notice ok">{status}</div>}
      {err && <div className="notice err">{err}</div>}
    </form>
  );
}
