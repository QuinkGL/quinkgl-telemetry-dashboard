import { Download } from "lucide-react";
import { getDashboardNodes, getDashboardSwarms, useDashboardState } from "../../../lib/dashboardState";
import { formatNumber, formatShape } from "../../lib/dashboardUi";

export function Swarms() {
  const state = useDashboardState();
  const swarms = getDashboardSwarms(state);
  const nodes = getDashboardNodes(state);
  const activeDomains = new Set(nodes.map((node) => node.domain).filter(Boolean)).size;

  const metrics = [
    { label: "Active swarms", value: formatNumber(swarms.length) },
    { label: "Total peers", value: formatNumber(nodes.length) },
    { label: "Active domains", value: formatNumber(activeDomains) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
            <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
            <div className="text-lg text-[var(--text-primary)] mono">{metric.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-3">Active Swarms</h2>
        {swarms.length ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {swarms.map((swarm) => (
              <div key={swarm.swarmId} className="bg-[var(--surface)] border border-[var(--border)] rounded p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base text-[var(--text-primary)] mb-1">{swarm.swarmName || swarm.swarmId}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{swarm.description || "Telemetry manifest metadata"}</p>
                    </div>
                    <button className="p-2 hover:bg-[var(--bg-elevated)] rounded transition-colors group" title="Manifest export is served by the telemetry API">
                      <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--gold-mid)]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-[var(--text-muted)] mono">hash:</span>
                    <span className="text-xs text-[var(--gold-mid)] mono">{swarm.manifestHash || "-"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Peer count</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(swarm.peerCount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Task type</div>
                    <div className="text-sm text-[var(--text-primary)]">{swarm.taskType || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Aggregation</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{swarm.aggregationName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Topology</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{swarm.topologyName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Input</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatShape(swarm.inputShape)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Output</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatShape(swarm.outputShape)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Label type</div>
                    <div className="text-sm text-[var(--text-primary)]">{swarm.labelType || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded p-8 text-center text-sm text-[var(--text-muted)]">
            Waiting for swarm manifests from telemetry.
          </div>
        )}
      </div>
    </div>
  );
}
