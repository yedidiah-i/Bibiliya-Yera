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

      <section className="web-section" id="installer" aria-labelledby="installer-title">
        <div className="web-section-heading">
          <p className="eyebrow">Official v1.0.24 downloads</p>
          <h2 id="installer-title">Install the app on your computer.</h2>
          <p>Choose the package for your operating system. Every download below comes directly from the official Bibiliya Yera GitHub release.</p>
        </div>
        <div className="web-download-grid">
          <article className="web-installer-card web-download-card">
            <strong>Windows</strong>
            <span>Recommended for Windows 10 and 11</span>
            <a className="web-primary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera_1.0.0_x64-setup.exe">Download Windows installer (.exe)</a>
            <a className="web-release-link" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera.exe">Download portable Windows .exe</a>
            <small>Use the installer for a normal setup, or the portable .exe without installation. If Windows shows a warning, follow the steps below.</small>
          </article>
          <article className="web-installer-card web-download-card">
            <strong>macOS</strong>
            <span>Universal app for Intel and Apple Silicon</span>
            <a className="web-secondary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera_1.0.0_universal.dmg">Download macOS .dmg</a>
            <small>Open the downloaded disk image, then drag Bibiliya Yera to Applications.</small>
          </article>
          <article className="web-installer-card web-download-card">
            <strong>Linux</strong>
            <span>Ubuntu, Debian, Fedora, and portable Linux</span>
            <div className="web-download-row">
              <a className="web-secondary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera_1.0.0_amd64.deb">.deb</a>
              <a className="web-secondary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera-1.0.0-1.x86_64.rpm">.rpm</a>
              <a className="web-secondary" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/download/v1.0.24/bibiliya-yera_1.0.0_amd64.AppImage">AppImage</a>
            </div>
            <small>Use .deb for Debian/Ubuntu, .rpm for Fedora, or AppImage without installation.</small>
          </article>
        </div>
        <a className="web-release-link" href="https://github.com/yedidiah-i/Bibiliya-Yera/releases/tag/v1.0.24">View all v1.0.24 release files on GitHub</a>
      </section>

      <section className="web-section web-help" aria-labelledby="install-help-title">
        <div className="web-section-heading">
          <p className="eyebrow">Installation help</p>
          <h2 id="install-help-title">If your computer shows a security warning.</h2>
          <p>These warnings usually mean the app is new or not notarized yet. The files are still hosted in the official repository.</p>
        </div>
        <div className="web-help-grid">
          <article><h3>Windows: “Windows protected your PC”</h3><ol><li>Download the <strong>.exe</strong> from the button above.</li><li>Open it and select <strong>More info</strong>.</li><li>Select <strong>Run anyway</strong>, then continue through setup.</li></ol></article>
          <article><h3>macOS: “Cannot be opened”</h3><ol><li>Open the .dmg and move the app to Applications.</li><li>Control-click the app and select <strong>Open</strong>.</li><li>Confirm <strong>Open</strong> in the dialog. If needed, go to System Settings → Privacy &amp; Security → Open Anyway.</li></ol></article>
          <article><h3>Linux: permission denied</h3><ol><li>For .deb or .rpm, open the package with your software manager.</li><li>For AppImage, right-click the file and enable <strong>Allow executing file as program</strong>.</li><li>Then double-click the AppImage to launch it.</li></ol></article>
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
