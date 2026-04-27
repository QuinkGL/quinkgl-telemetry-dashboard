import {
  getDashboardEvents,
  getDashboardKpis,
  getDashboardMlSummary,
  getDashboardNodes,
  useDashboardState,
} from "../../../lib/dashboardState";
import {
  eventSummary,
  eventTone,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatTime,
  nodeDisplayStatus,
  relativeAge,
  statusTone,
  toTitle,
} from "../../lib/dashboardUi";

function metricClass(status) {
  if (status === "success") return "text-[var(--success)]";
  if (status === "warning") return "text-[var(--warning)]";
  if (status === "danger") return "text-[var(--danger)]";
  return "text-[var(--text-primary)]";
}

function eventColor(type) {
  if (type === "transfer") return "bg-[var(--info)] text-[var(--info)]";
  if (type === "aggregation") return "bg-[var(--gold-mid)] text-[var(--gold-mid)]";
  if (type === "training") return "bg-[var(--success)] text-[var(--success)]";
  if (type === "error") return "bg-[var(--danger)] text-[var(--danger)]";
  return "bg-[var(--text-muted)] text-[var(--text-muted)]";
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr className="border-t border-[var(--border)]">
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
        {children}
      </td>
    </tr>
  );
}

export function Overview() {
  const state = useDashboardState();
  const kpis = getDashboardKpis(state);
  const nodes = getDashboardNodes(state);
  const events = getDashboardEvents(state).slice(0, 6);
  const mlSummary = getDashboardMlSummary(state);
  const totalAggregations = nodes.reduce((sum, node) => sum + node.aggregationsCompleted, 0);
  const totalMessages = nodes.reduce((sum, node) => sum + node.modelsSent + node.modelsReceived, 0);
  const offlineNodes = nodes.filter((node) => !node.running || node.status === "offline").length;
  const alertCount = [
    statusTone(state.connection.status) === "danger",
    nodes.length > 0 && kpis.activeNodeCount === 0,
    events.some((event) => event.severity === "error" || String(event.eventType).includes("fail")),
  ].filter(Boolean).length;

  const metrics = [
    { label: "Socket", value: state.connection.status, status: statusTone(state.connection.status) },
    { label: "Active nodes", value: formatNumber(kpis.activeNodeCount), status: "normal" },
    { label: "Active swarms", value: formatNumber(kpis.activeSwarmCount), status: "normal" },
    { label: "Offline nodes", value: formatNumber(offlineNodes), status: offlineNodes ? "warning" : "success" },
    { label: "Last update", value: relativeAge(state.session.lastUpdatedAt ?? state.connection.lastConnectedAt), status: "normal" },
    { label: "Critical alerts", value: formatNumber(alertCount), status: alertCount ? "danger" : "success" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
            <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
            <div className={`text-lg mono ${metricClass(metric.status)}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Node Roster</h2>
          <div className="border border-[var(--border)] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Node ID</th>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Domain</th>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Swarm</th>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Round</th>
                    <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Peers</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.length ? nodes.map((node) => {
                    const status = nodeDisplayStatus(node);
                    const tone = statusTone(status);
                    return (
                      <tr key={node.nodeId} className="border-t border-[var(--border)] hover:bg-[var(--surface)]/50">
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{node.nodeId}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{node.domain || "-"}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{node.swarmName || node.swarmId || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${tone === "success" ? "bg-[var(--success)]/10 text-[var(--success)]" : tone === "danger" ? "bg-[var(--danger)]/10 text-[var(--danger)]" : "bg-[var(--warning)]/10 text-[var(--warning)]"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tone === "success" ? "bg-[var(--success)]" : tone === "danger" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`} />
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{formatNumber(node.currentRound)}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{formatNumber(node.knownPeerCount)}</td>
                      </tr>
                    );
                  }) : <EmptyRow colSpan={6}>Waiting for telemetry heartbeats from QuinkGL peers.</EmptyRow>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Training Convergence</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 space-y-4">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Total aggregations</div>
              <div className="text-2xl text-[var(--text-primary)] mono">{formatNumber(totalAggregations)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Aggregation success rate</div>
              <div className="text-2xl text-[var(--success)] mono">{totalMessages ? formatPercent(totalAggregations / totalMessages) : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Avg accuracy / loss</div>
              <div className="text-2xl text-[var(--gold-mid)] mono">{formatPercent(mlSummary.global.avgAccuracy)} / {formatDecimal(mlSummary.global.avgLoss)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Active domains</div>
              <div className="text-2xl text-[var(--text-primary)] mono">{formatNumber(kpis.activeDomainCount)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Event Timeline</h2>
        </div>

        <div className="border border-[var(--border)] rounded overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {events.length ? events.map((event) => {
              const tone = eventTone(event.eventType);
              const color = eventColor(tone);
              return (
                <div key={event.id} className="px-4 py-3 hover:bg-[var(--surface)]/50 flex items-start gap-3">
                  <span className="text-xs text-[var(--text-muted)] mono mt-0.5 flex-shrink-0">{formatTime(event.timestamp)}</span>
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${color.split(" ")[0]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs uppercase tracking-wider ${color.split(" ")[1]}`}>{toTitle(event.eventType)}</span>
                      <span className="text-xs text-[var(--text-muted)] mono">{event.nodeId || "-"}</span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{eventSummary(event)}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                Waiting for runtime events from the telemetry stream.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
