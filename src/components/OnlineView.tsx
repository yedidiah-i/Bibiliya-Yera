import { useEffect, useState } from "react";
import { api, type FeedManifest, type InstalledPack } from "../lib/api";
import { actions, useApp } from "../lib/store";
import { shortDate } from "../lib/format";
import { Icon } from "./Icon";

interface Props {
  packs: InstalledPack[];
  onRefresh: () => void;
  online: boolean;
}

const KIND_LABEL: Record<string, string> = {
  devotionals: "Ibitekerezo bya buri munsi",
  notes: "Ibisobanuro ku mirongo",
  plans: "Gahunda zo gusoma",
};

export function OnlineView({ packs, onRefresh, online }: Props) {
  const app = useApp();
  const [url, setUrl] = useState(app.feed.url);
  const [manifest, setManifest] = useState<FeedManifest | null>(null);
  const [busy, setBusy] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setUrl(app.feed.url), [app.feed.url]);

  const check = async () => {
    const target = url.trim();
    if (!target) {
      setError("Shyiramo aderesi ya manifest.json mbere.");
      return;
    }
    actions.setFeedUrl(target);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const m = await api.feedCheck(target);
      setManifest(m);
      actions.markFeedChecked();
      setMessage(m.packs.length === 0 ? "Nta byongewe bishya kuri iyi seriveri." : "Ibyongewe byabonetse.");
    } catch (e) {
      setManifest(null);
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const install = async (packId: string) => {
    setInstalling(packId);
    setError(null);
    setMessage(null);
    try {
      await api.feedInstall(url.trim(), packId);
      onRefresh();
      setMessage("Ibyongewe byashyizwe mu buryo. Biraboneka nta murandasi.");
    } catch (e) {
      setError(String(e));
    } finally {
      setInstalling(null);
    }
  };

  const remove = async (packId: string) => {
    try {
      await api.feedUninstall(packId);
      onRefresh();
      setMessage("Ibyongewe byakuweho.");
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="page online">
      <div className="eyebrow">Ihuza n&apos;isi</div>
      <h1>Ibyongewe</h1>
      <p className="lede">
        Bibiliya Yera ikora yose nta murandasi. Iyo internet ihari, ushobora gukurura ibitekerezo
        bishya, ibisobanuro cyangwa gahunda nshya zishyizwe ku murongo n&apos;uwanditse porogaramu.
      </p>

      <div className={`net-banner ${online ? "on" : ""}`}>
        <Icon name={online ? "globe" : "info"} size={16} />
        <span>
          {online
            ? "Uri kuri murandasi: ushobora kugenzura ibyongewe."
            : "Nta murandasi: gusoma bikomeza gukora nk'uko bisanzwe."}
        </span>
      </div>

      <section className="card">
        <div className="card-head">
          <span className="chip">
            <Icon name="download" size={13} /> Aderesi y&apos;ibyongewe
          </span>
        </div>
        <div className="feed-url">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/manifest.json"
            spellCheck={false}
          />
          <button className="btn primary small" onClick={check} disabled={busy}>
            {busy ? "Turagenzura…" : "Genzura"}
          </button>
        </div>
        <p className="muted small">
          Aderesi ibikwa muri iyi mudasobwa. Ntacyo wohereza hanze uretse gusaba iyi dosiye.
          {app.feed.lastCheck ? ` Iheruka kugenzurwa: ${shortDate(app.feed.lastCheck)}.` : ""}
        </p>
        {message && <div className="notice ok">{message}</div>}
        {error && <div className="notice err">{error}</div>}
      </section>

      {manifest && (
        <section className="card">
          <div className="card-head">
            <span className="chip gold">
              <Icon name="sparkle" size={13} /> Bihari kuri seriveri
            </span>
            {manifest.updated && <span className="muted small">Byavuguruwe: {manifest.updated}</span>}
          </div>
          {manifest.message && <p className="muted">{manifest.message}</p>}
          <div className="pack-list">
            {manifest.packs.map((p) => {
              const have = packs.find((x) => x.meta.id === p.id);
              const upToDate = have && have.meta.version === p.version;
              return (
                <div key={p.id} className="pack">
                  <div className="pack-main">
                    <strong>{p.title || p.id}</strong>
                    <span className="muted small">
                      {KIND_LABEL[p.type] ?? p.type}
                      {p.version ? ` · verisiyo ${p.version}` : ""}
                      {p.size ? ` · ${Math.round(p.size / 1024)} KB` : ""}
                    </span>
                    {p.notes && <span className="pack-notes">{p.notes}</span>}
                  </div>
                  <button
                    className={`btn small ${upToDate ? "ghost" : "primary"}`}
                    disabled={installing === p.id || Boolean(upToDate)}
                    onClick={() => install(p.id)}
                  >
                    {upToDate ? "Bishyizweho" : installing === p.id ? "Turazana…" : have ? "Vugurura" : "Shyira mu buryo"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <span className="chip">
            <Icon name="check" size={13} /> Ibyongewe biri mu mudasobwa
          </span>
        </div>
        {packs.length === 0 ? (
          <p className="muted">
            Nta byongewe birimo. Ibyanditswe byose (ibice 1.189) birahari uko byakabaye.
          </p>
        ) : (
          <div className="pack-list">
            {packs.map((p) => (
              <div key={p.meta.id} className="pack">
                <div className="pack-main">
                  <strong>{p.meta.title}</strong>
                  <span className="muted small">
                    {KIND_LABEL[p.meta.type] ?? p.meta.type} · {p.meta.version}
                  </span>
                </div>
                <button className="icon-btn" title="Kuraho" onClick={() => remove(p.meta.id)}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
