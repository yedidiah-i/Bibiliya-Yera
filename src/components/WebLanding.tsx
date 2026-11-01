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
      <nav className="web-nav" aria-label="Main navigation">
        <a className="web-brand" href="#top"><span>BY</span> Bibiliya Yera</a>
        <div className="web-nav-links">
          <a href="#features">Features</a>
          <a href="#installer">Windows app</a>
          <a href="#support">Support</a>
        </div>
      </nav>

      <section className="web-hero" id="top">
        <div className="web-mark">BY</div>
        <p className="eyebrow">Bibiliya Yera</p>
        <h1>Read God&apos;s Word wherever you are.</h1>
        <p className="web-lede">
          Explore the Bible in a calm, focused reading experience. Use the web version from any
          device, or install the Windows app for an offline library.
        </p>
        <div className="web-actions">
          <a className="web-primary" href="#features">Explore the features</a>
          <a className="web-secondary" href="#installer">Get the Windows app</a>
        </div>
      </section>

      <section className="web-section" id="features" aria-labelledby="features-title">
        <div className="web-section-heading">
          <p className="eyebrow">Built for daily reading</p>
          <h2 id="features-title">More than a few features.</h2>
          <p>Everything you need to read, search, remember, and return to meaningful passages.</p>
        </div>
        <div className="web-feature-grid">
          <article><span>01</span><h3>Read without distraction</h3><p>Move through books and chapters in a clean layout designed to keep the text central.</p></article>
          <article><span>02</span><h3>Find any passage</h3><p>Search across your Bible and jump directly to the book, chapter, and verse you need.</p></article>
          <article><span>03</span><h3>Save what matters</h3><p>Keep bookmarks, notes, and highlights close so important verses are easy to revisit.</p></article>
          <article><span>04</span><h3>Read your way</h3><p>Adjust text size and choose a comfortable theme for morning, evening, or night reading.</p></article>
        </div>
      </section>

      <section className="web-section web-split" id="installer" aria-labelledby="installer-title">
        <div>
          <p className="eyebrow">Windows desktop app</p>
          <h2 id="installer-title">A Bible library that works offline.</h2>
          <p>Install Bibiliya Yera on Windows with the MSI installer from the latest GitHub release.</p>
        </div>
        <div className="web-installer-card">
          <strong>Bibiliya Yera for Windows</strong>
          <span>MSI installer</span>
          <a className="web-primary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/untagged-7e522b0ae07f05ceca3b/Bibiliya.Yera_1.0.0_x64_en-US.msi">Download MSI installer</a>
          <small>Version 1.0.0 for 64-bit Windows. Hosted on the Bibiliya Yera GitHub release.</small>
        </div>
      </section>

      <section className="web-support" id="support" aria-labelledby="support-title">
        <div>
          <p className="eyebrow">We&apos;re here to help</p>
          <h2 id="support-title">Found a problem?</h2>
          <p>Tell us what happened. Your email app will open with the message addressed to the support team.</p>
        </div>
        <form onSubmit={sendSupport} className="web-support-form">
          <label htmlFor="web-support-message">Describe the problem</label>
          <textarea id="web-support-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What happened?" required rows={5} />
          <button type="submit">Email support</button>
          {sent && <p role="status">Your email app was opened. You can also write to {SUPPORT_EMAIL}.</p>}
        </form>
      </section>

      <footer className="web-footer">Bibiliya Yera · Read, reflect, and return.</footer>
    </main>
  );
}
