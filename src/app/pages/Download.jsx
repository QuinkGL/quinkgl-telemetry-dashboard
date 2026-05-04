import { Download, ExternalLink, ShieldCheck } from "lucide-react";

const releaseTag = "v0.1.2";
const releasePage = `https://github.com/QuinkGL/quinkgl-desktop/releases/tag/${releaseTag}`;

const downloads = [
  {
    platform: "Windows",
    file: "QuinkGL-Desktop-windows.zip",
    link: `https://github.com/QuinkGL/quinkgl-desktop/releases/download/${releaseTag}/QuinkGL-Desktop-windows.zip`,
  },
  {
    platform: "macOS",
    file: "QuinkGL-Desktop-macos.zip",
    link: `https://github.com/QuinkGL/quinkgl-desktop/releases/download/${releaseTag}/QuinkGL-Desktop-macos.zip`,
  },
  {
    platform: "Linux",
    file: "QuinkGL-Desktop-linux.tar.gz",
    link: `https://github.com/QuinkGL/quinkgl-desktop/releases/download/${releaseTag}/QuinkGL-Desktop-linux.tar.gz`,
  },
];

export function DownloadPage() {
  return (
    <main className="h-full overflow-y-auto bg-[var(--bg-base)]">
      <section className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Desktop Distribution</p>
          <h1 className="text-4xl text-[var(--text-primary)]">Download QuinkGL Desktop</h1>
          <p className="max-w-3xl text-[var(--text-secondary)] leading-relaxed">
            QuinkGL Desktop is the operator-facing application for running and monitoring decentralized gossip-learning workflows.
            Download official binaries directly from GitHub Releases.
          </p>
          <a
            href={releasePage}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--gold-mid)] hover:text-[var(--gold-light)] transition-colors"
          >
            Latest release: {releaseTag}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {downloads.map((item) => (
            <article key={item.platform} className="bg-[var(--surface)] border border-[var(--border)] rounded p-5 flex flex-col gap-4">
              <div className="space-y-1">
                <h2 className="text-lg text-[var(--text-primary)]">{item.platform}</h2>
                <p className="text-sm text-[var(--text-secondary)] mono break-all">{item.file}</p>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--gold-mid)] text-[var(--bg-base)] hover:bg-[var(--gold-light)] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </article>
          ))}
        </div>

        <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--success)] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Verify downloads from the official{" "}
              <a href={releasePage} target="_blank" rel="noreferrer" className="text-[var(--gold-mid)] hover:text-[var(--gold-light)] transition-colors">
                QuinkGL Desktop release page
              </a>
              . Check release notes and source tags before production rollout.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
