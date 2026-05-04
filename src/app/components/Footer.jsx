import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-sm text-[var(--text-primary)]">QuinkGL</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Decentralized gossip learning framework for peer-to-peer edge AI training and federated learning without a central server.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm text-[var(--text-primary)]">Pages</h2>
          <div className="flex flex-col gap-1 text-sm">
            <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors">Home</Link>
            <Link to="/docs" className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors">Documentation</Link>
            <Link to="/download" className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors">Download Desktop</Link>
            <Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors">Dashboard</Link>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm text-[var(--text-primary)]">Sources</h2>
          <div className="flex flex-col gap-1 text-sm">
            <a
              href="https://github.com/QuinkGL/quinkgl-desktop/releases/tag/v0.1.2"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors"
            >
              Desktop Release v0.1.2
            </a>
            <a
              href="https://github.com/QuinkGL/quinkgl-desktop"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors"
            >
              quinkgl-desktop Repository
            </a>
            <a
              href="https://github.com/QuinkGL"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--gold-mid)] transition-colors"
            >
              QuinkGL Organization
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
