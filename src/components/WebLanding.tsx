import { useState } from "react";

const SUPPORT_EMAIL = "futureksmeyedidiah@gmail.com";

export function WebLanding() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function sendSupport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    const subject = encodeURIComponent("Bibiliya Yera web support");
    const body = encodeURIComponent(trimmed);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <main className="web-landing">
      <section className="web-hero">
        <div className="web-mark">BY</div>
        <p className="eyebrow">Bibiliya Yera</p>
        <h1>Soma Ijambo ry&apos;Imana aho uri hose.</h1>
        <p className="web-lede">
          Verisiyo yo kuri murandasi iraboneka hano. Ushobora no gukuramo porogaramu ya Windows
          ukoresheje installer ya MSI igihe dosiye ishyizwe kuri releases.
        </p>
        <div className="web-actions">
          <a className="web-primary" href="#support">Tanga ikibazo</a>
          <a className="web-secondary" href="/downloads/bibiliya-yera.msi" download>
            Kuramo installer ya MSI
          </a>
        </div>
        <p className="web-download-note">MSI installer: dosiye izaboneka hano nyuma yo gushyirwa kuri releases.</p>
      </section>

      <section className="web-support" id="support" aria-labelledby="support-title">
        <div>
          <p className="eyebrow">Ubufasha</p>
          <h2 id="support-title">Hari ikibazo wahuye na cyo?</h2>
          <p>Twandikire ikibazo cyawe. Kanda kohereza kugira ngo ubutumwa bufungure email ya support.</p>
        </div>
        <form onSubmit={sendSupport} className="web-support-form">
          <label htmlFor="web-support-message">Sobanura ikibazo</label>
          <textarea
            id="web-support-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Andika ikibazo wahuye na cyo…"
            required
            rows={5}
          />
          <button type="submit">Ohereza kuri support</button>
          {sent && <p role="status">Email yarafunguwe. Niba itafungutse, andikira {SUPPORT_EMAIL}.</p>}
        </form>
      </section>
    </main>
  );
}
