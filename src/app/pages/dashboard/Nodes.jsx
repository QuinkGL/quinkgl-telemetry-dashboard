import { Eye } from "lucide-react";
import { getDashboardEvents, getDashboardNodes, useDashboardState } from "../../../lib/dashboardState";
import {
  eventSummary,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatTime,
  nodeDisplayStatus,
  statusTone,
} from "../../lib/dashboardUi";

export function Nodes() {
  const state = useDashboardState();
  const nodes = getDashboardNodes(state);
  const events = getDashboardEvents(state).slice(0, 6);
  const runningNodes = nodes.filter((node) => node.running).length;
  const offlineNodes = nodes.filter((node) => !node.running || node.status === "offline").length;

  const metrics = [
    { label: "Visible nodes", value: formatNumber(nodes.length) },
    { label: "Running nodes", value: formatNumber(runningNodes) },
    { label: "Offline nodes", value: formatNumber(offlineNodes) },
    { label: "Selected node", value: state.selectedNodeId || "none" },
  ];

  const peerConnections = nodes
    .filter((node) => node.peerIds.length || node.lastSentPeerIds.length)
    .slice(0, 6)
    .map((node) => ({
      nodeId: node.nodeId,
      peers: Array.from(new Set([...node.peerIds, ...node.lastSentPeerIds])),
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
            <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
            <div className="text-lg text-[var(--text-primary)] mono">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Node Roster</h2>
          <div className="space-y-3">
            {nodes.length ? nodes.map((node) => {
              const status = nodeDisplayStatus(node);
              const tone = statusTone(status);
              return (
                <div key={node.nodeId} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${tone === "success" ? "bg-[var(--success)]" : tone === "danger" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`} />
                      <div>
                        <div className="text-sm text-[var(--text-primary)] mono mb-0.5">{node.nodeId}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {node.domain || "-"} · {node.swarmName || node.swarmId || "-"}
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] hover:border-[var(--gold-mid)] hover:text-[var(--gold-mid)] transition-colors flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      Inspect
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-0.5">Round</div>
                      <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(node.currentRound)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-0.5">Peers</div>
                      <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(node.knownPeerCount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-0.5">Accuracy</div>
                      <div className="text-sm text-[var(--success)] mono">{formatPercent(node.lastAccuracy)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-0.5">Loss</div>
                      <div className="text-sm text-[var(--text-primary)] mono">{formatDecimal(node.lastLoss)}</div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="border border-[var(--border)] rounded p-8 text-center text-sm text-[var(--text-muted)]">
                Waiting for node heartbeats from telemetry.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Peer Inventory</h2>
            <div className="space-y-2">
              {peerConnections.length ? peerConnections.map((conn) => (
                <div key={conn.nodeId} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
                  <div className="text-xs text-[var(--text-primary)] mono mb-2">{conn.nodeId}</div>
                  <div className="text-xs text-[var(--text-muted)] mb-1.5">{conn.peers.length} peers</div>
                  <div className="flex flex-wrap gap-1.5">
                    {conn.peers.map((peer) => (
                      <span key={peer} className="px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] mono">
                        {peer}
                      </span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="border border-[var(--border)] rounded p-4 text-xs text-[var(--text-muted)]">No peer inventory yet.</div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Recent Node Activity</h2>
            <div className="space-y-2">
              {events.length ? events.map((event) => (
                <div key={event.id} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
                  <div className="text-xs text-[var(--text-muted)] mono mb-1">{formatTime(event.timestamp)}</div>
                  <div className="text-xs text-[var(--text-primary)] mono mb-1">{event.nodeId || "-"}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{eventSummary(event)}</div>
                </div>
              )) : (
                <div className="border border-[var(--border)] rounded p-4 text-xs text-[var(--text-muted)]">No runtime events yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
