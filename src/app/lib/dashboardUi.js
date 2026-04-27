export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return "-"
  return new Intl.NumberFormat().format(Number(value))
}

export function formatDecimal(value, digits = 3) {
  if (value == null || Number.isNaN(Number(value))) return "-"
  return Number(value).toFixed(digits)
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return "-"
  return `${Math.round(Number(value) * 1000) / 10}%`
}

export function formatShape(value) {
  return Array.isArray(value) && value.length ? value.join(" x ") : "-"
}

export function formatTime(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function relativeAge(value) {
  if (!value) return "No updates"
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return "No updates"
  const delta = Math.max(0, Date.now() - timestamp)
  if (delta < 60_000) return "just now"
  const minutes = Math.max(1, Math.round(delta / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}

export function toTitle(value) {
  return String(value || "event").replaceAll("_", " ")
}

export function statusTone(status) {
  if (["live", "open", "ready", "running", "training", "online"].includes(status)) return "success"
  if (["loading", "connecting", "reconnecting", "idle", "stale"].includes(status)) return "warning"
  if (["error", "socket_error", "closed", "offline"].includes(status)) return "danger"
  return "normal"
}

export function nodeDisplayStatus(node) {
  if (!node?.running || node?.status === "offline") return "offline"
  if (node.status === "idle") return "idle"
  return node.status || "running"
}

export function eventSummary(event) {
  if (event.summary) return event.summary
  const payload = event.payload || {}
  if (event.eventType === "training_completed") {
    const parts = [`round ${payload.round ?? event.round ?? "-"}`]
    if (payload.loss ?? payload.final_loss) parts.push(`loss ${formatDecimal(payload.loss ?? payload.final_loss)}`)
    if (payload.accuracy ?? payload.final_accuracy) parts.push(`accuracy ${formatPercent(payload.accuracy ?? payload.final_accuracy)}`)
    return `Completed ${parts.join(", ")}`
  }
  if (event.eventType === "model_sent") return `Sent model update to ${payload.peer_id ?? payload.peerId ?? event.relatedNodeId ?? "peer"}`
  if (event.eventType === "model_received") return `Received model update from ${payload.peer_id ?? payload.peerId ?? event.relatedNodeId ?? "peer"}`
  if (event.eventType === "aggregation_completed") return `Aggregated ${payload.peer_count ?? payload.peerCount ?? "-"} peer updates`
  if (event.eventType === "peer_discovered") return `Discovered peer ${payload.peer_id ?? payload.peerId ?? event.relatedNodeId ?? "peer"}`
  return toTitle(event.eventType)
}

export function eventTone(eventType) {
  if (String(eventType).includes("model")) return "transfer"
  if (String(eventType).includes("aggregation")) return "aggregation"
  if (String(eventType).includes("training")) return "training"
  if (String(eventType).includes("error") || String(eventType).includes("fail")) return "error"
  return "system"
}
