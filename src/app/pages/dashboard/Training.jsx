import {
  getDashboardMlSummary,
  getDashboardNodes,
  getDashboardRounds,
  useDashboardState,
} from "../../../lib/dashboardState";
import { formatDecimal, formatNumber, formatPercent, formatTime } from "../../lib/dashboardUi";

export function Training() {
  const state = useDashboardState();
  const nodes = getDashboardNodes(state);
  const mlSummary = getDashboardMlSummary(state);
  const rounds = getDashboardRounds(state)
    .sort((left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime())
    .slice(0, 8);

  const metrics = [
    { label: "Latest round", value: formatNumber(mlSummary.latestRound) },
    { label: "Avg accuracy", value: formatPercent(mlSummary.global.avgAccuracy) },
    { label: "Avg loss", value: formatDecimal(mlSummary.global.avgLoss) },
    { label: "Transfer paths", value: formatNumber(mlSummary.global.transferPathCount) },
  ];

  const summary = [
    { label: "Latest round", value: formatNumber(mlSummary.latestRound) },
    { label: "Avg accuracy", value: formatPercent(mlSummary.global.avgAccuracy) },
    { label: "Avg loss", value: formatDecimal(mlSummary.global.avgLoss) },
    { label: "Stale nodes", value: formatNumber(mlSummary.global.staleNodeCount) },
  ];

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

      <div className="space-y-3">
        <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Global Learning Summary</h2>
        <div className="grid md:grid-cols-4 gap-3">
          {summary.map((item) => (
            <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
              <div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
              <div className="text-xl text-[var(--text-primary)] mono">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Node Training Snapshot</h2>
        {nodes.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {nodes.map((node) => (
              <div key={node.nodeId} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm text-[var(--text-primary)] mono mb-0.5">{node.nodeId}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{node.domain || "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Round</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(node.currentRound)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Accuracy</div>
                    <div className="text-sm text-[var(--success)] mono">{formatPercent(node.lastAccuracy)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Loss</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatDecimal(node.lastLoss)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Samples</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(node.lastSamplesTrained)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Completed rounds</div>
                    <div className="text-sm text-[var(--text-primary)] mono">{formatNumber(node.trainingRoundsCompleted)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded p-8 text-center text-sm text-[var(--text-muted)]">
            Waiting for training telemetry.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Recent Rounds</h2>
        <div className="border border-[var(--border)] rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface)]">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Node</th>
                <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Round</th>
                <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Loss</th>
                <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Accuracy</th>
                <th className="text-left px-4 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {rounds.length ? rounds.map((round, index) => (
                <tr key={`${round.nodeId}-${round.round}-${index}`} className="border-t border-[var(--border)] hover:bg-[var(--surface)]/50">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{round.nodeId}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{formatNumber(round.round)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)] mono">{formatDecimal(round.loss)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--success)] mono">{formatPercent(round.accuracy)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] mono">{formatTime(round.timestamp)}</td>
                </tr>
              )) : (
                <tr className="border-t border-[var(--border)]">
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No round summaries received yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
