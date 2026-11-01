import { FormEvent, useState } from "react";
import { Icon } from "./Icon";

const SUPPORT_EMAIL = "futureksmeyedidiah@gmail.com";

export function SupportView({ online }: { online: boolean }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [problem, setProblem] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problem.trim()) return;
    const subject = `Bibiliya Yera support${name.trim() ? ` — ${name.trim()}` : ""}`;
    const body = [
      `Ikibazo: ${problem.trim()}`,
      name.trim() ? `\nIzina: ${name.trim()}` : "",
      contact.trim() ? `Aho twasubiza: ${contact.trim()}` : "",
      `\nInternet: ${online ? "irakora" : "ntabwo ikora"}`,
    ].join("\n");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="page settings">
      <div className="eyebrow">Ubufasha</div>
      <h1>Tubwire ikibazo wahuye na cyo</h1>
      <p className="muted">Tuzakoresha porogaramu ya email iri kuri mudasobwa yawe kohereza ubutumwa.</p>

      <section className="card">
        <div className="card-head">
          <span className="chip"><Icon name="info" size={13} /> Ohereza ikibazo</span>
        </div>
        <form className="support-form" onSubmit={submit}>
          <label>
            Izina (si ngombwa)
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Izina ryawe" />
          </label>
          <label>
            Email cyangwa telefone (si ngombwa)
            <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Aho twagusubiza" />
          </label>
          <label>
            Ikibazo wahuye na cyo
            <textarea required rows={7} value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Sobanura ikibazo mu magambo make..." />
          </label>
          <button className="btn primary" type="submit" disabled={!online || !problem.trim()}>
            Ohereza kuri {SUPPORT_EMAIL}
          </button>
          {!online && <div className="notice err">Internet irakenewe kugira ngo porogaramu ya email ifunguke.</div>}
          {sent && <div className="notice ok">Ubutumwa bwateguwe. Kanda Send muri porogaramu ya email yafungutse.</div>}
        </form>
      </section>
    </div>
  );
}
