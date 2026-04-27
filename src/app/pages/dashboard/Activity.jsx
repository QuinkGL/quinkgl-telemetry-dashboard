import { getDashboardEvents, getDashboardKpis, useDashboardState } from "../../../lib/dashboardState";
import { eventSummary, eventTone, formatNumber, formatTime, relativeAge, toTitle } from "../../lib/dashboardUi";

function eventClasses(type) {
  if (type === "transfer") return ["bg-[var(--info)]", "text-[var(--info)]"];
  if (type === "aggregation") return ["bg-[var(--gold-mid)]", "text-[var(--gold-mid)]"];
  if (type === "training") return ["bg-[var(--success)]", "text-[var(--success)]"];
  if (type === "error") return ["bg-[var(--danger)]", "text-[var(--danger)]"];
  return ["bg-[var(--text-muted)]", "text-[var(--text-muted)]"];
}

export function Activity() {
  const state = useDashboardState();
  const kpis = getDashboardKpis(state);
  const events = getDashboardEvents(state);

  const metrics = [
    { label: "Events", value: formatNumber(events.length) },
    { label: "Last sync", value: relativeAge(state.session.lastUpdatedAt ?? state.connection.lastConnectedAt) },
    { label: "Session ID", value: state.session.sessionId || "-" },
    { label: "Active nodes", value: formatNumber(kpis.activeNodeCount) },
  ];

  const sessionSummary = [
    { label: "Started", value: relativeAge(state.session.startedAt) },
    { label: "Active nodes", value: formatNumber(kpis.activeNodeCount) },
    { label: "Domains", value: formatNumber(kpis.activeDomainCount) },
    { label: "Edges", value: formatNumber(kpis.totalEdgeCount) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
            <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
            <div className="text-sm text-[var(--text-primary)] mono">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Event Stream</h2>
          </div>

          <div className="border border-[var(--border)] rounded overflow-hidden">
            <div className="divide-y divide-[var(--border)] max-h-[700px] overflow-y-auto">
              {events.length ? events.map((event) => {
                const [dotClass, textClass] = eventClasses(eventTone(event.eventType));
                return (
                  <div key={event.id} className="px-4 py-3 hover:bg-[var(--surface)]/50 flex items-start gap-3">
                    <span className="text-xs text-[var(--text-muted)] mono mt-0.5 flex-shrink-0 w-16">{formatTime(event.timestamp)}</span>
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs uppercase tracking-wider ${textClass}`}>{toTitle(event.eventType)}</span>
                        <span className="text-xs text-[var(--text-muted)] mono">{event.nodeId || "-"}</span>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">{eventSummary(event)}</div>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  Waiting for telemetry events.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">Session Summary</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 space-y-4">
            {sessionSummary.map((item) => (
              <div key={item.label}>
                <div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
                <div className="text-sm text-[var(--text-primary)] mono">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
