import { useState } from "react";

const sections = [
  { id: "concept", title: "Concept" },
  { id: "swarms", title: "Swarms & Manifests" },
  { id: "cycle", title: "Learning cycle" },
  { id: "telemetry", title: "Telemetry" },
  { id: "security", title: "Security" },
  { id: "quickstart", title: "Quick start" },
  { id: "operators", title: "Operator map" },
];

function TerminalBlock({ label, command }) {
  return (
    <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-xs text-[var(--text-muted)] mono uppercase tracking-wider">{label}</span>
        <span className="w-12" />
      </div>
      <pre className="p-4 text-sm mono text-[var(--text-primary)] overflow-x-auto leading-relaxed whitespace-pre-wrap">
        <span className="text-[var(--gold-mid)] select-none">$ </span>
        {command}
      </pre>
    </div>
  );
}

function InfoPanel({ title, children }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-5 space-y-2">
      <h3 className="text-sm text-[var(--gold-mid)]">{title}</h3>
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{children}</div>
    </div>
  );
}

export function Documentation() {
  const [activeSection, setActiveSection] = useState("concept");

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-60 border-r border-[var(--border)] bg-[var(--bg-elevated)] overflow-y-auto">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Documentation</div>
          <div className="text-sm text-[var(--text-primary)]">Table of Contents</div>
        </div>
        <nav className="p-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors relative ${activeSection === section.id ? "bg-[var(--surface)] text-[var(--gold-mid)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"}`}
            >
              {activeSection === section.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--gold-mid)]" />}
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-12">
          {activeSection === "concept" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Concept</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                QuinkGL is a decentralized gossip learning framework for P2P edge intelligence. Peers train locally,
                discover compatible peers, exchange model updates, and aggregate without a central coordinator.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoPanel title="Why gossip learning">
                  Gossip learning removes the federated-learning server bottleneck. There is no single coordinator,
                  peer churn is expected, and communication load is distributed across the swarm.
                </InfoPanel>
                <InfoPanel title="What remains centralized">
                  Telemetry is intentionally separate from training. Peers can report runtime metadata to a dashboard,
                  but model weights and raw data remain on peer machines.
                </InfoPanel>
              </div>
              <div className="border border-[var(--border)] rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--surface)]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Area</th>
                      <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Centralized FL</th>
                      <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">QuinkGL gossip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Server", "Required", "None for learning"],
                      ["Failure mode", "Coordinator outage stops training", "Peers continue through churn"],
                      ["Networking", "Server link bottleneck", "Distributed peer links"],
                      ["Compatibility", "Orchestrator controls clients", "Manifest hash gates swarms"],
                    ].map(([area, centralized, gossip]) => (
                      <tr key={area} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{area}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{centralized}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{gossip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === "swarms" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Swarms & Manifests</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                A swarm is identified by a canonical `.qgl` manifest. The swarm ID is derived from the SHA-256 hash of
                canonical manifest bytes, and the IPv8 community ID is the first 20 bytes of that swarm ID.
              </p>
              <div className="grid gap-4">
                {[
                  ["Task", "classification, regression, segmentation, or detection with input/output shapes and label type"],
                  ["Model", "framework plus `sha256:<64-hex>` architecture hash; weights are not part of the architecture hash"],
                  ["Aggregation", "strategy name and params such as FedAvg, Krum, MultiKrum, TrimmedMean, or FedProx"],
                  ["Topology", "peer selection strategy such as Random, Cyclon, or affinity-based selection"],
                  ["Policy", "privacy constraints, Byzantine tolerance, trust policy, creator signature, and round limit"],
                ].map(([name, desc]) => (
                  <div key={name} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
                    <h3 className="text-sm text-[var(--gold-mid)] mb-1">{name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
                  </div>
                ))}
              </div>
              <TerminalBlock
                label="manifest"
                command={`quinkgl manifest create \\
  --name my-swarm \\
  --task-type class \\
  --input-shape 3,224,224 \\
  --output-shape 10 \\
  --label-type integer \\
  --model-framework pytorch \\
  --model-arch-hash sha256:7f2c1a9b3e4d0123456789abcdef0123456789abcdef0123456789abcdef0123 \\
  --aggregation FedAvg \\
  --topology Random \\
  --output my-swarm.qgl`}
              />
            </section>
          )}

          {activeSection === "cycle" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Learning cycle</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">Each peer repeats the same runtime loop:</p>
              <div className="space-y-3">
                {[
                  "Load and validate manifest; compute swarm and community IDs",
                  "Start IPv8 community and announce availability",
                  "Train locally on private data",
                  "Select compatible peers using the topology strategy",
                  "Send and receive model updates",
                  "Aggregate using the manifest strategy",
                  "Emit telemetry events and continue until the round limit or operator stop",
                ].map((step, i) => (
                  <div key={step} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--gold-dark)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[var(--gold-mid)]">{i + 1}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{step}</p>
                  </div>
                ))}
              </div>
              <InfoPanel title="Convergence signal">
                Runtime convergence depends on a connected communication graph, sufficient peer exchange frequency, and
                sensible learning-rate scheduling. QuinkGL can expose graph and round telemetry so the dashboard can
                show liveness, transfer paths, loss, and accuracy trends.
              </InfoPanel>
            </section>
          )}

          {activeSection === "telemetry" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Telemetry</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                The dashboard consumes a separate FastAPI telemetry service. Peers POST runtime events and heartbeats;
                the React dashboard reads REST snapshots and subscribes to a WebSocket stream.
              </p>
              <div className="border border-[var(--border)] rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--surface)]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Endpoint</th>
                      <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["GET /api/session", "session metadata"],
                      ["GET /api/nodes", "node snapshots"],
                      ["GET /api/events", "activity feed"],
                      ["GET /api/rounds", "round summaries"],
                      ["GET /api/network/graph", "topology nodes and edges"],
                      ["GET /api/swarms", "manifest and swarm metadata"],
                      ["POST /api/telemetry/events", "authenticated peer event ingest"],
                      ["POST /api/telemetry/heartbeats", "authenticated heartbeat ingest"],
                      ["WS /api/stream or /api/ws", "live dashboard updates"],
                    ].map(([endpoint, purpose]) => (
                      <tr key={endpoint} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{endpoint}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TerminalBlock
                label="enroll swarm"
                command={`quinkgl telemetry enroll my-swarm.qgl --dashboard-url https://dash.quinkgl.io`}
              />
              <TerminalBlock
                label="run peer"
                command={`# my-swarm.telemetry.qglkey now sits next to my-swarm.qgl
quinkgl run \\
  --manifest my-swarm.qgl \\
  --script peer_script.py`}
              />
              <TerminalBlock
                label="private qglkey"
                command={`{
  "schema_version": 1,
  "swarm_id": "<manifest-hash>",
  "dashboard_url": "https://dash.quinkgl.io",
  "ingest_token": "qgl_live_<private-token>"
}`}
              />
            </section>
          )}

          {activeSection === "security" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Security</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Production swarms should combine signed manifests, an explicit trust policy, TLS-protected telemetry,
                restricted CORS, and an ingest secret for telemetry writes.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <InfoPanel title="open">
                  Accepts unsigned manifests. Useful for local testing and workshops; not appropriate for untrusted networks.
                </InfoPanel>
                <InfoPanel title="tofu">
                  Trust-on-first-use caches the first creator pubkey for a swarm ID and rejects later creator changes.
                </InfoPanel>
                <InfoPanel title="pinned">
                  Requires signed manifests from an allowlisted Ed25519 creator. Recommended for production deployments.
                </InfoPanel>
              </div>
              <TerminalBlock
                label="signed manifest"
                command={`quinkgl keygen --output creator.key
quinkgl manifest create ... --sign-with creator.key --output signed.qgl
quinkgl manifest verify signed.qgl --trusted-pubkey ed25519:<hex>`}
              />
            </section>
          )}

          {activeSection === "quickstart" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Quick start</h2>
              <div className="space-y-4">
                <TerminalBlock label="install" command="pip install quinkgl" />
                <TerminalBlock label="create manifest" command="quinkgl manifest create --name my-swarm --task-type class --input-shape 784 --output-shape 10 --label-type integer --model-framework pytorch --model-arch-hash sha256:0000000000000000000000000000000000000000000000000000000000000000 --aggregation FedAvg --topology Random --output my-swarm.qgl" />
                <TerminalBlock label="run peer" command="quinkgl run --manifest my-swarm.qgl --script peer_script.py --node-id peer-1" />
              </div>
              <InfoPanel title="Local multi-peer testing">
                Run multiple peers with the same manifest and different node IDs. Once telemetry is enabled, this dashboard
                will show node heartbeats, peer discovery, transfer events, aggregation rounds, and network edges.
              </InfoPanel>
            </section>
          )}

          {activeSection === "operators" && (
            <section className="space-y-6">
              <h2 className="text-2xl text-[var(--text-primary)]">Operator map</h2>
              <div className="grid gap-4">
                {[
                  ["New user", "Read Getting Started, then run Tutorial T1."],
                  ["Swarm creator", "Define model architecture, compute arch hash, create/sign manifest, publish or share `.qgl`."],
                  ["Peer operator", "Run `quinkgl run` with a manifest, model/data script, shared telemetry secret, and trust policy."],
                  ["Dashboard operator", "Deploy the FastAPI telemetry server and this React dashboard on the VPS; configure API base URL and CORS."],
                  ["Production owner", "Use pinned trust, TLS, telemetry secret, rate limits, and incident/key-rotation procedures."],
                ].map(([role, action]) => (
                  <div key={role} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
                    <h3 className="text-sm text-[var(--gold-mid)] mb-1">{role}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{action}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
