import { useSyncExternalStore } from 'react'

import { createDashboardApi, createDemoDashboardSnapshot } from './dashboardApi.js'
import { createDashboardSocket } from './dashboardSocket.js'

const NODE_STALE_AFTER_MS = 20_000

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toString(value, fallback = '') {
  return value == null ? fallback : String(value)
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value == null) {
    return []
  }

  return [value]
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value))))
}

function toCamelCaseKey(value) {
  return String(value).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function camelizeObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeObject(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [toCamelCaseKey(key), camelizeObject(nestedValue)]),
  )
}

function formatTimestamp(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function timestampMillis(value) {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }

  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY
}

function timestampAge(value) {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const date = new Date(value)
  const timestamp = date.getTime()
  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY
  }

  return Math.max(0, Date.now() - timestamp)
}

function sortByTimestampDesc(values) {
  return [...values].sort((left, right) => timestampMillis(right.timestamp) - timestampMillis(left.timestamp))
}

function resolveSelectedNodeId({
  candidateId = null,
  previousSelectedNodeId = null,
  nodesById = {},
  nodeOrder = [],
  source = 'live',
  allowSingletonFallback = false,
} = {}) {
  if (candidateId != null) {
    return nodesById[candidateId] ? candidateId : null
  }

  if (previousSelectedNodeId != null) {
    return nodesById[previousSelectedNodeId] ? previousSelectedNodeId : null
  }

  if (allowSingletonFallback && (source === 'demo' || source === 'local') && nodeOrder.length === 1) {
    return nodeOrder[0] ?? null
  }

  return null
}

function deriveNodeStatus(node, { preserveStatus = false } = {}) {
  if (preserveStatus) {
    return {
      ...node,
      status: node.status || (node.running ? 'running' : 'idle'),
    }
  }

  const freshestTimestamp = [
    node.lastSeenAt,
    node.lastAggregationAt,
    node.lastReceiveAt,
    node.lastSendAt,
    node.lastTrainingAt,
  ].find(Boolean)
  const age = timestampAge(freshestTimestamp)
  const isActive = age <= NODE_STALE_AFTER_MS

  if (!isActive) {
    return {
      ...node,
      running: false,
      status: 'offline',
    }
  }

  if (node.running) {
    return {
      ...node,
      status: node.status === 'offline' ? 'running' : node.status,
    }
  }

  return {
    ...node,
    status: node.status || 'idle',
  }
}

function createEmptyNode(nodeId = null) {
  return {
    nodeId,
    domain: 'unknown',
    connectionMode: 'unknown',
    running: false,
    status: 'idle',
    currentRound: 0,
    knownPeerCount: 0,
    peerIds: [],
    lastSeenAt: null,
    lastTrainingAt: null,
    lastSendAt: null,
    lastReceiveAt: null,
    lastAggregationAt: null,
    sessionStartedAt: null,
    uptimeSeconds: 0,
    lastLoss: null,
    lastAccuracy: null,
    lastSamplesTrained: null,
    trainingRoundsCompleted: 0,
    modelsSent: 0,
    modelsReceived: 0,
    lastSentPeerIds: [],
    lastReceivedPeerId: null,
    aggregationsCompleted: 0,
    lastAggregationPeerCount: 0,
    lastAggregationTotalSamples: 0,
    aggregationStrategy: '',
    swarmId: '',
    swarmName: '',
    manifestHash: '',
    aggregationName: '',
    topologyName: '',
    chunkedTransfersSent: 0,
    chunkedTransfersReceived: 0,
    resendRequests: 0,
    sendFailures: 0,
  }
}

function normalizeNode(node = {}, fallbackNodeId = null) {
  const nodeId = toString(node.node_id ?? node.nodeId ?? fallbackNodeId, fallbackNodeId)
  const peerIds = uniqueStrings([
    ...toArray(node.peer_ids ?? node.peerIds),
    ...toArray(node.last_sent_peer_ids ?? node.lastSentPeerIds),
  ])

  return {
    ...createEmptyNode(nodeId),
    nodeId,
    domain: toString(node.domain, 'unknown'),
    connectionMode: toString(node.connection_mode ?? node.connectionMode, 'unknown'),
    swarmId: toString(node.swarm_id ?? node.swarmId),
    swarmName: toString(node.swarm_name ?? node.swarmName),
    manifestHash: toString(node.manifest_hash ?? node.manifestHash),
    aggregationName: toString(node.aggregation_name ?? node.aggregationName, ''),
    topologyName: toString(node.topology_name ?? node.topologyName, ''),
    running: Boolean(node.running),
    status: toString(node.status, node.running ? 'running' : 'idle'),
    currentRound: toNumber(node.current_round ?? node.currentRound),
    knownPeerCount: peerIds.length,
    peerIds,
    lastSeenAt: formatTimestamp(node.last_seen_at ?? node.lastSeenAt),
    lastTrainingAt: formatTimestamp(node.last_training_at ?? node.lastTrainingAt),
    lastSendAt: formatTimestamp(node.last_send_at ?? node.lastSendAt),
    lastReceiveAt: formatTimestamp(node.last_receive_at ?? node.lastReceiveAt),
    lastAggregationAt: formatTimestamp(node.last_aggregation_at ?? node.lastAggregationAt),
    sessionStartedAt: formatTimestamp(node.session_started_at ?? node.sessionStartedAt),
    uptimeSeconds: toNumber(node.uptime_seconds ?? node.uptimeSeconds),
    lastLoss: node.last_loss ?? node.lastLoss ?? null,
    lastAccuracy: node.last_accuracy ?? node.lastAccuracy ?? null,
    lastSamplesTrained: toNumber(node.last_samples_trained ?? node.lastSamplesTrained, 0),
    trainingRoundsCompleted: toNumber(node.training_rounds_completed ?? node.trainingRoundsCompleted),
    modelsSent: toNumber(node.models_sent ?? node.modelsSent),
    modelsReceived: toNumber(node.models_received ?? node.modelsReceived),
    lastSentPeerIds: uniqueStrings(toArray(node.last_sent_peer_ids ?? node.lastSentPeerIds)),
    lastReceivedPeerId: node.last_received_peer_id ?? node.lastReceivedPeerId ?? null,
    aggregationsCompleted: toNumber(node.aggregations_completed ?? node.aggregationsCompleted),
    lastAggregationPeerCount: toNumber(node.last_aggregation_peer_count ?? node.lastAggregationPeerCount),
    lastAggregationTotalSamples: toNumber(node.last_aggregation_total_samples ?? node.lastAggregationTotalSamples),
    aggregationStrategy: toString(node.aggregation_strategy ?? node.aggregationStrategy, ''),
    chunkedTransfersSent: toNumber(node.chunked_transfers_sent ?? node.chunkedTransfersSent),
    chunkedTransfersReceived: toNumber(node.chunked_transfers_received ?? node.chunkedTransfersReceived),
    resendRequests: toNumber(node.resend_requests ?? node.resendRequests),
    sendFailures: toNumber(node.send_failures ?? node.sendFailures),
  }
}

function normalizeSwarm(swarm = {}) {
  return {
    swarmId: toString(swarm.swarm_id ?? swarm.swarmId),
    swarmName: toString(swarm.swarm_name ?? swarm.swarmName, 'Unnamed swarm'),
    manifestHash: toString(swarm.manifest_hash ?? swarm.manifestHash),
    description: toString(swarm.description, ''),
    peerCount: toNumber(swarm.peer_count ?? swarm.peerCount),
    aggregationName: toString(swarm.aggregation_name ?? swarm.aggregationName, ''),
    topologyName: toString(swarm.topology_name ?? swarm.topologyName, ''),
    taskType: toString(swarm.task_type ?? swarm.taskType, ''),
    inputShape: toArray(swarm.input_shape ?? swarm.inputShape),
    outputShape: toArray(swarm.output_shape ?? swarm.outputShape),
    labelType: toString(swarm.label_type ?? swarm.labelType, ''),
    roundLimit: swarm.round_limit ?? swarm.roundLimit ?? null,
    createdAt: formatTimestamp(swarm.created_at ?? swarm.createdAt),
    domains: uniqueStrings(toArray(swarm.domains)),
  }
}

function normalizeEvent(event = {}, fallbackNodeId = null) {
  const eventType = toString(event.event_type ?? event.eventType ?? event.type, 'event')
  const nodeId = toString(
    event.node_id ?? event.nodeId ?? event.payload?.node_id ?? event.payload?.nodeId ?? fallbackNodeId,
    fallbackNodeId,
  )

  return {
    id: toString(event.id, `${nodeId}-${eventType}-${event.timestamp ?? Date.now()}`),
    nodeId,
    eventType,
    timestamp: formatTimestamp(event.timestamp),
    payload: event.payload ? { ...event.payload } : {},
    title: toString(event.title, eventType.replaceAll('_', ' ')),
    summary: toString(event.summary, ''),
    relatedNodeId: event.related_node_id ?? event.relatedNodeId ?? null,
    round: event.round ?? null,
    severity: toString(event.severity, 'info'),
  }
}

function normalizeRound(round = {}, fallbackNodeId = null) {
  return {
    nodeId: toString(round.node_id ?? round.nodeId ?? fallbackNodeId, fallbackNodeId),
    round: toNumber(round.round ?? round.round_number ?? round.roundNumber),
    timestamp: formatTimestamp(round.timestamp),
    loss: round.loss ?? null,
    accuracy: round.accuracy ?? null,
    samplesTrained: toNumber(round.samples_trained ?? round.samplesTrained),
    durationSeconds: round.duration_seconds ?? round.durationSeconds ?? null,
  }
}

function normalizeEdge(edge = {}) {
  const source = toString(edge.source ?? edge.from ?? edge.node_a ?? edge.source_node_id ?? edge.sourceNodeId, '')
  const target = toString(edge.target ?? edge.to ?? edge.node_b ?? edge.target_node_id ?? edge.targetNodeId, '')
  const edgeType = toString(edge.edge_type ?? edge.edgeType, 'peer_link')
  const id = toString(edge.id, source && target ? `${source}::${target}::${edgeType}` : `${source}-${target}-${edgeType}`)

  return {
    id,
    source,
    target,
    edgeType,
    weight: edge.weight ?? null,
    lastSeenAt: formatTimestamp(edge.last_seen_at ?? edge.lastSeenAt ?? edge.last_active_at ?? edge.lastActiveAt),
    lastActiveAt: formatTimestamp(edge.last_active_at ?? edge.lastActiveAt ?? edge.last_seen_at ?? edge.lastSeenAt),
    exchangeCount: toNumber(edge.exchange_count ?? edge.exchangeCount),
    discoveryCount: toNumber(edge.discovery_count ?? edge.discoveryCount),
    lastRound: edge.last_round ?? edge.lastRound ?? null,
    lastEventType: toString(edge.last_event_type ?? edge.lastEventType, ''),
    lastWeightSummary: camelizeObject(edge.last_weight_summary ?? edge.lastWeightSummary ?? {}),
  }
}

function deriveEdgesFromNodes(nodesById) {
  const edges = []
  const seen = new Set()

  Object.values(nodesById).forEach((node) => {
    node.peerIds.forEach((peerId) => {
      if (!peerId || peerId === node.nodeId) {
        return
      }

      const edgeKey = [node.nodeId, peerId].sort().join('::')
      if (seen.has(edgeKey)) {
        return
      }

      seen.add(edgeKey)
      edges.push({
        id: edgeKey,
        source: node.nodeId,
        target: peerId,
        weight: 0.5,
        lastSeenAt: node.lastSeenAt,
      })
    })
  })

  return edges
}

function deriveGraphNodes(nodes) {
  if (!nodes.length) {
    return []
  }

  return nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length
    return {
      id: node.nodeId,
      x: 50 + Math.round(Math.cos(angle) * 35),
      y: 50 + Math.round(Math.sin(angle) * 35),
      status: node.running ? 'running' : 'idle',
      domain: node.domain,
    }
  })
}

function createEmptyDashboardState() {
  return {
    source: 'unknown',
    connection: {
      status: 'idle',
      detail: 'Waiting for telemetry bootstrap',
      url: null,
      attempts: 0,
      mode: 'unknown',
      lastError: null,
      lastConnectedAt: null,
    },
    session: {
      sessionId: null,
      startedAt: null,
      lastUpdatedAt: null,
      selectedNodeId: null,
      activeNodeCount: 0,
      domainSummary: [],
    },
    nodesById: {},
    nodeOrder: [],
    swarmsById: {},
    swarmOrder: [],
    eventsByNodeId: {},
    roundsByNodeId: {},
    network: {
      nodes: [],
      edges: [],
      stats: {
        nodeCount: 0,
        activeEdgeCount: 0,
        activeDomainCount: 0,
        messageVolume: 0,
        peerChurn: 0,
        chunkedTransferCount: 0,
        retryCount: 0,
      },
    },
    activityFeed: [],
    selectedNodeId: null,
  }
}

function finalizeDashboardState(state) {
  const preserveStatus = state.source === 'demo'
  const nodes = state.nodeOrder
    .map((nodeId) => deriveNodeStatus(state.nodesById[nodeId], { preserveStatus }))
    .filter(Boolean)
  const activeNodeCount = nodes.filter((node) => node.running).length
  const activeSwarmCount = state.swarmOrder.filter((id) => id && state.swarmsById[id]?.swarmId).length
  const domains = uniqueStrings(nodes.map((node) => node.domain))
  const recentEvents = state.activityFeed.slice(0, 20)
  const recentExchangeCount = recentEvents.filter((event) => ['model_sent', 'model_received'].includes(event.eventType)).length
  const recentAggregationCount = recentEvents.filter((event) => event.eventType === 'aggregation_completed').length
  const liveNodeIds = new Map(nodes.map((node) => [node.nodeId, node]))
  const networkNodes = (state.network.nodes.length ? state.network.nodes : deriveGraphNodes(nodes)).map((node) => ({
    ...node,
    status: liveNodeIds.get(node.id)?.status ?? node.status ?? 'offline',
  }))
  const networkEdges = state.network.edges.length ? state.network.edges : deriveEdgesFromNodes(state.nodesById)

  return {
    ...state,
    selectedNodeId: state.selectedNodeId ?? state.session.selectedNodeId ?? null,
    nodesById: Object.fromEntries(nodes.map((node) => [node.nodeId, node])),
    session: {
      ...state.session,
      activeNodeCount,
      domainSummary: domains.map((domain) => ({
        domain,
        nodeCount: nodes.filter((node) => node.domain === domain).length,
      })),
      lastUpdatedAt: state.activityFeed[0]?.timestamp ?? state.session.lastUpdatedAt,
    },
    network: {
      ...state.network,
      nodes: networkNodes,
      edges: networkEdges,
      stats: {
        ...state.network.stats,
        nodeCount: nodes.length,
        activeEdgeCount: networkEdges.length,
        activeDomainCount: domains.length,
        messageVolume: state.activityFeed.length,
        peerChurn: state.activityFeed.filter((event) => ['peer_discovered', 'peer_removed'].includes(event.eventType)).length,
        chunkedTransferCount: nodes.reduce((sum, node) => sum + node.chunkedTransfersSent + node.chunkedTransfersReceived, 0),
        retryCount: nodes.reduce((sum, node) => sum + node.resendRequests + node.sendFailures, 0),
      },
    },
    summary: {
      activeNodeCount,
      activeSwarmCount,
      activeDomainCount: domains.length,
      totalEdgeCount: networkEdges.length,
      recentExchangeCount,
      recentAggregationCount,
    },
  }
}

function mergeNodeSnapshot(state, nodePatch = {}) {
  const node = normalizeNode(nodePatch, nodePatch.node_id ?? nodePatch.nodeId ?? null)
  const nodeId = node.nodeId
  const previous = state.nodesById[nodeId] ?? createEmptyNode(nodeId)
  const nextNode = {
    ...previous,
    ...node,
    peerIds: uniqueStrings([...previous.peerIds, ...node.peerIds]),
    lastSentPeerIds: uniqueStrings([...previous.lastSentPeerIds, ...node.lastSentPeerIds]),
  }

  const nodeOrder = state.nodeOrder.includes(nodeId) ? state.nodeOrder : [...state.nodeOrder, nodeId]
  const nodesById = {
    ...state.nodesById,
    [nodeId]: nextNode,
  }

  const nextState = {
    ...state,
    nodesById,
    nodeOrder,
    selectedNodeId: resolveSelectedNodeId({
      previousSelectedNodeId: state.selectedNodeId ?? state.session.selectedNodeId ?? null,
      nodesById,
      nodeOrder,
      source: state.source,
      allowSingletonFallback: true,
    }),
  }

  return finalizeDashboardState(nextState)
}

function mergeNetworkEdge(state, edgePatch = {}) {
  const edge = normalizeEdge(edgePatch)
  if (!edge.source || !edge.target) {
    return state
  }

  const edgeIndex = state.network.edges.findIndex((item) => item.id === edge.id)
  const nextEdges = edgeIndex >= 0
    ? state.network.edges.map((item, index) => (index === edgeIndex ? { ...item, ...edge } : item))
    : [...state.network.edges, edge]

  return finalizeDashboardState({
    ...state,
    network: {
      ...state.network,
      edges: nextEdges,
      nodes: state.network.nodes.length ? state.network.nodes : deriveGraphNodes(state.nodeOrder.map((nodeId) => state.nodesById[nodeId]).filter(Boolean)),
    },
  })
}

function applyNodeEventToNode(node, event) {
  const payload = event.payload ?? {}
  const eventType = event.eventType
  const nextNode = {
    ...node,
    lastSeenAt: event.timestamp ?? node.lastSeenAt,
  }

  if (eventType === 'training_started') {
    return {
      ...nextNode,
      lastTrainingAt: event.timestamp ?? node.lastTrainingAt,
      status: node.running ? 'training' : node.status,
    }
  }

  if (eventType === 'training_completed') {
    return {
      ...nextNode,
      lastTrainingAt: event.timestamp ?? node.lastTrainingAt,
      lastLoss: payload.loss ?? payload.final_loss ?? node.lastLoss,
      lastAccuracy: payload.accuracy ?? payload.final_accuracy ?? node.lastAccuracy,
      lastSamplesTrained: toNumber(payload.samples_trained ?? payload.samplesTrained, node.lastSamplesTrained),
      trainingRoundsCompleted: node.trainingRoundsCompleted + 1,
      currentRound: payload.round ?? payload.current_round ?? node.currentRound,
      status: node.running ? 'running' : node.status,
    }
  }

  if (eventType === 'model_send_started') {
    return {
      ...nextNode,
      lastSendAt: event.timestamp ?? node.lastSendAt,
    }
  }

  if (eventType === 'model_sent') {
    const sentPeers = uniqueStrings([
      ...node.lastSentPeerIds,
      ...toArray(payload.peer_ids ?? payload.peerIds),
      payload.peer_id,
    ])

    return {
      ...nextNode,
      lastSendAt: event.timestamp ?? node.lastSendAt,
      modelsSent: node.modelsSent + 1,
      lastSentPeerIds: sentPeers,
      chunkedTransfersSent: node.chunkedTransfersSent + (payload.chunked_transfer_count ?? 0),
    }
  }

  if (eventType === 'model_received') {
    return {
      ...nextNode,
      lastReceiveAt: event.timestamp ?? node.lastReceiveAt,
      modelsReceived: node.modelsReceived + 1,
      lastReceivedPeerId: payload.peer_id ?? payload.peerId ?? node.lastReceivedPeerId,
      chunkedTransfersReceived: node.chunkedTransfersReceived + (payload.chunked_transfer_count ?? 0),
    }
  }

  if (eventType === 'aggregation_completed') {
    return {
      ...nextNode,
      lastAggregationAt: event.timestamp ?? node.lastAggregationAt,
      aggregationsCompleted: node.aggregationsCompleted + 1,
      lastAggregationPeerCount: toNumber(payload.peer_count ?? payload.peerCount, node.lastAggregationPeerCount),
      lastAggregationTotalSamples: toNumber(payload.total_samples ?? payload.totalSamples, node.lastAggregationTotalSamples),
      aggregationStrategy: toString(payload.strategy_name ?? payload.strategyName ?? payload.strategy, node.aggregationStrategy),
    }
  }

  if (eventType === 'targets_selected') {
    const selectedTargets = uniqueStrings(toArray(payload.selected_targets ?? payload.selectedTargets))
    const peerIds = uniqueStrings([...node.peerIds, ...selectedTargets])
    return {
      ...nextNode,
      knownPeerCount: peerIds.length,
      peerIds,
    }
  }

  if (eventType === 'peer_discovered') {
    const peerId = payload.peer_id ?? payload.peerId
    const peerIds = peerId ? uniqueStrings([...node.peerIds, peerId]) : node.peerIds
    return {
      ...nextNode,
      knownPeerCount: peerIds.length,
      peerIds,
    }
  }

  if (eventType === 'peer_removed' || eventType === 'peer_disconnected') {
    const peerId = payload.peer_id ?? payload.peerId
    const peerIds = peerId ? node.peerIds.filter((candidate) => candidate !== peerId) : node.peerIds
    return {
      ...nextNode,
      knownPeerCount: peerIds.length,
      peerIds,
    }
  }

  return nextNode
}

function appendNodeEvent(state, eventInput = {}, fallbackNodeId = null) {
  const event = normalizeEvent(eventInput, eventInput.node_id ?? eventInput.nodeId ?? fallbackNodeId)
  const nodeId = event.nodeId || state.selectedNodeId || 'unknown-node'
  const previousNode = state.nodesById[nodeId] ?? createEmptyNode(nodeId)
  const nextNode = applyNodeEventToNode(previousNode, event)
  const nextEventsByNodeId = {
    ...state.eventsByNodeId,
    [nodeId]: sortByTimestampDesc([event, ...(state.eventsByNodeId[nodeId] ?? [])]).slice(0, 40),
  }

  const nextRoundsByNodeId = { ...state.roundsByNodeId }
  if (event.eventType === 'training_completed') {
    nextRoundsByNodeId[nodeId] = [
      {
        nodeId,
        round: toNumber(event.payload.round ?? event.payload.current_round, nextNode.currentRound),
        timestamp: event.timestamp,
        loss: event.payload.loss ?? event.payload.final_loss ?? null,
        accuracy: event.payload.accuracy ?? event.payload.final_accuracy ?? null,
        samplesTrained: toNumber(event.payload.samples_trained ?? event.payload.samplesTrained, 0),
      },
      ...(state.roundsByNodeId[nodeId] ?? []),
    ]
    nextRoundsByNodeId[nodeId] = sortByTimestampDesc(nextRoundsByNodeId[nodeId]).slice(0, 40)
  }

  return finalizeDashboardState({
    ...state,
    nodesById: {
      ...state.nodesById,
      [nodeId]: nextNode,
    },
    nodeOrder: state.nodeOrder.includes(nodeId) ? state.nodeOrder : [...state.nodeOrder, nodeId],
    eventsByNodeId: nextEventsByNodeId,
    roundsByNodeId: nextRoundsByNodeId,
    activityFeed: [event, ...state.activityFeed].slice(0, 80),
    selectedNodeId: resolveSelectedNodeId({
      previousSelectedNodeId: state.selectedNodeId ?? state.session.selectedNodeId ?? null,
      nodesById: {
        ...state.nodesById,
        [nodeId]: nextNode,
      },
      nodeOrder: state.nodeOrder.includes(nodeId) ? state.nodeOrder : [...state.nodeOrder, nodeId],
      source: state.source,
      allowSingletonFallback: true,
    }),
  })
}

export function buildDashboardState(snapshot = {}) {
  const state = createEmptyDashboardState()
  const nodes = toArray(snapshot.nodes ?? snapshot.node_snapshots ?? snapshot.nodeSnapshots)
  const rounds = toArray(snapshot.rounds ?? snapshot.roundSummaries)
  const events = toArray(snapshot.events ?? snapshot.activityFeed ?? snapshot.node_events)
  const session = snapshot.session ?? {}
  const network = snapshot.network ?? {}
  const connection = snapshot.connection ?? {}
  const source = toString(snapshot.source ?? snapshot.mode, 'live')
  const mode = toString(snapshot.mode ?? snapshot.source, source)
  const nodeEntries = nodes.map((node) => normalizeNode(node, node.node_id ?? node.nodeId ?? null))
  const nodesById = Object.fromEntries(nodeEntries.map((node) => [node.nodeId, node]))
  const nodeOrder = nodeEntries.map((node) => node.nodeId)
  const eventsByNodeId = events.reduce((acc, event) => {
    const normalized = normalizeEvent(event, event.node_id ?? event.nodeId ?? null)
    const nodeId = normalized.nodeId || 'unknown-node'
    acc[nodeId] = [...(acc[nodeId] ?? []), normalized]
    return acc
  }, {})
  const roundsByNodeId = rounds.reduce((acc, round) => {
    const normalized = normalizeRound(round, round.node_id ?? round.nodeId ?? null)
    const nodeId = normalized.nodeId || 'unknown-node'
    acc[nodeId] = [...(acc[nodeId] ?? []), normalized]
    return acc
  }, {})
  Object.keys(eventsByNodeId).forEach((nodeId) => {
    eventsByNodeId[nodeId] = sortByTimestampDesc(eventsByNodeId[nodeId])
  })
  Object.keys(roundsByNodeId).forEach((nodeId) => {
    roundsByNodeId[nodeId] = sortByTimestampDesc(roundsByNodeId[nodeId])
  })
  const activityFeed = events.map((event) => normalizeEvent(event, event.node_id ?? event.nodeId ?? null)).sort(
    (left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime(),
  )

  const networkEdges = toArray(network.edges).map((edge) => normalizeEdge(edge))
  const swarmEntries = toArray(snapshot.swarms).map((swarm) => normalizeSwarm(swarm))
  const swarmsById = Object.fromEntries(swarmEntries.map((s) => [s.swarmId, s]))
  const swarmOrder = swarmEntries.map((s) => s.swarmId)
  const networkNodes = toArray(network.nodes).map((node) => ({
    id: toString(node.node_id ?? node.nodeId, ''),
    x: toNumber(node.x, 0),
    y: toNumber(node.y, 0),
    status: toString(node.status, 'idle'),
    domain: toString(node.domain, 'unknown'),
  }))
  const explicitSelectedNodeId = snapshot.selectedNodeId
    ?? snapshot.selected_node_id
    ?? session.selected_node_id
    ?? session.selectedNodeId
    ?? null
  const selectedNodeId = resolveSelectedNodeId({
    candidateId: explicitSelectedNodeId,
    nodesById,
    nodeOrder,
    source,
    allowSingletonFallback: explicitSelectedNodeId == null,
  })
  const connectionStatus = toString(connection.status, mode === 'demo' ? 'demo' : 'ready')
  const connectionDetail = connection.detail
    ?? (connectionStatus === 'error' || connectionStatus === 'socket_error'
      ? 'Socket error'
      : connectionStatus === 'reconnecting'
        ? 'Reconnecting telemetry socket'
        : connectionStatus === 'connecting'
          ? 'Opening live telemetry socket'
          : mode === 'demo'
            ? 'Telemetry service unavailable; showing demo snapshot'
            : 'Hydrated from telemetry REST API')

  const nextState = finalizeDashboardState({
    ...state,
    source,
    connection: {
      ...state.connection,
      status: connectionStatus,
      detail: connectionDetail,
      mode: toString(connection.mode, mode),
      url: connection.url ?? state.connection.url,
      attempts: toNumber(connection.attempts, state.connection.attempts),
      lastError: connection.last_error ?? connection.lastError ?? null,
      lastConnectedAt: formatTimestamp(connection.last_connected_at ?? connection.lastConnectedAt),
    },
    session: {
      ...state.session,
      sessionId: session.session_id ?? session.sessionId ?? snapshot.session_id ?? null,
      startedAt: formatTimestamp(session.started_at ?? session.startedAt ?? snapshot.started_at ?? null),
      lastUpdatedAt: formatTimestamp(session.last_updated_at ?? session.lastUpdatedAt ?? null),
      selectedNodeId,
    },
    nodesById,
    nodeOrder,
    swarmsById,
    swarmOrder,
    eventsByNodeId,
    roundsByNodeId,
    network: {
      ...state.network,
      nodes: networkNodes.length ? networkNodes : deriveGraphNodes(nodeEntries),
      edges: networkEdges.length ? networkEdges : deriveEdgesFromNodes(nodesById),
      stats: {
        ...state.network.stats,
        ...(network.stats ?? {}),
      },
    },
    activityFeed,
    selectedNodeId,
  })

  return nextState
}

export function applyDashboardMessage(state, message = {}) {
  const kind = toString(message.type ?? message.event_type ?? message.kind, '')

  if (!kind) {
    return state
  }

  if (['bootstrap', 'dashboard_snapshot', 'session_snapshot'].includes(kind)) {
    return buildDashboardState(message.snapshot ?? message)
  }

  if (kind === 'node_snapshot_updated') {
    return mergeNodeSnapshot(state, message.node ?? message.snapshot ?? message.payload ?? message)
  }

  if (kind === 'node_event_received' || kind === 'node_event') {
    return appendNodeEvent(
      state,
      message.event ?? message.payload ?? message,
      message.node_id ?? message.nodeId ?? null,
    )
  }

  if (kind === 'network_edge_updated') {
    return mergeNetworkEdge(state, message.edge ?? message.payload ?? message)
  }

  if (kind === 'session_stats_updated') {
    const sessionPatch = message.session ?? message.payload ?? {}
    const selectedNodeId = resolveSelectedNodeId({
      candidateId: sessionPatch.selected_node_id ?? sessionPatch.selectedNodeId ?? null,
      previousSelectedNodeId: state.selectedNodeId ?? state.session.selectedNodeId ?? null,
      nodesById: state.nodesById,
      nodeOrder: state.nodeOrder,
      source: state.source,
      allowSingletonFallback: false,
    })
    return finalizeDashboardState({
      ...state,
      session: {
        ...state.session,
        ...camelizeObject(sessionPatch),
        selectedNodeId,
        lastUpdatedAt: formatTimestamp(sessionPatch.last_updated_at ?? sessionPatch.lastUpdatedAt ?? message.timestamp ?? state.session.lastUpdatedAt),
      },
      selectedNodeId,
    })
  }

  return state
}

export function getDashboardKpis(state) {
  return state.summary ?? {
    activeNodeCount: 0,
    activeSwarmCount: 0,
    activeDomainCount: 0,
    totalEdgeCount: 0,
    recentExchangeCount: 0,
    recentAggregationCount: 0,
  }
}

const DASHBOARD_METRIC_METADATA = {
  activeNodeCount: {
    label: 'Active nodes',
    kind: 'direct',
    description: 'Nodes currently running and visible in the session runtime.',
  },
  totalEdgeCount: {
    label: 'Peer edges',
    kind: 'direct',
    description: 'Visible graph relationships across peer-link and transfer edges.',
  },
  recentExchangeCount: {
    label: 'Recent exchanges',
    kind: 'direct',
    description: 'Recent send and receive events observed in the activity feed.',
  },
  recentAggregationCount: {
    label: 'Recent aggregations',
    kind: 'direct',
    description: 'Aggregation completion events seen in the current session snapshot.',
  },
  activeDomainCount: {
    label: 'Active domains',
    kind: 'derived',
    description: 'Distinct active workload domains represented by visible nodes.',
  },
}

function getMlSummaryNodes(state) {
  const nodes = getDashboardNodes(state)
  const activeNodes = nodes.filter((node) => node.running)
  return activeNodes.length ? activeNodes : nodes
}

export function getDashboardMetricMetadata() {
  return DASHBOARD_METRIC_METADATA
}

export function getDashboardSwarms(state) {
  return state.swarmOrder.map((id) => state.swarmsById[id]).filter(Boolean)
}

export function getDashboardSwarm(state, swarmId) {
  return state.swarmsById[swarmId] ?? null
}

export function getNodesBySwarm(state, swarmId) {
  return getDashboardNodes(state).filter((n) => n.swarmId === swarmId)
}

export function getDashboardMlSummary(state) {
  const nodes = getMlSummaryNodes(state)
  const selectedNodeId = state.selectedNodeId ?? state.session.selectedNodeId ?? null
  const selectedNode = selectedNodeId ? state.nodesById[selectedNodeId] ?? null : null
  const visibleAccuracies = nodes.map((node) => Number(node.lastAccuracy)).filter(Number.isFinite)
  const visibleLosses = nodes.map((node) => Number(node.lastLoss)).filter(Number.isFinite)

  return {
    latestRound: Math.max(0, ...nodes.map((node) => node.currentRound || 0)),
    selectedNode,
    global: {
      avgAccuracy: visibleAccuracies.length
        ? visibleAccuracies.reduce((sum, value) => sum + value, 0) / visibleAccuracies.length
        : null,
      avgLoss: visibleLosses.length
        ? visibleLosses.reduce((sum, value) => sum + value, 0) / visibleLosses.length
        : null,
      staleNodeCount: getDashboardNodes(state).filter((node) => node.status === 'offline').length,
      transferPathCount: state.network.edges.filter((edge) => edge.edgeType === 'model_transfer').length,
    },
  }
}

export function getTopologyInspector(state, nodeId = state.selectedNodeId ?? state.session.selectedNodeId ?? null) {
  const node = nodeId ? state.nodesById[nodeId] ?? null : null
  if (!node) {
    return null
  }

  const outgoingTransferEdges = state.network.edges.filter(
    (edge) => edge.source === node.nodeId && edge.edgeType === 'model_transfer',
  )
  const incomingTransferEdges = state.network.edges.filter(
    (edge) => edge.target === node.nodeId && edge.edgeType === 'model_transfer',
  )

  return {
    node,
    selectedTargets: [...node.lastSentPeerIds],
    outgoingTransferEdges,
    incomingTransferEdges,
  }
}

export function getDashboardNodes(state) {
  return state.nodeOrder.map((nodeId) => state.nodesById[nodeId]).filter(Boolean)
}

export function getDashboardNode(state, nodeId) {
  const candidate = state.nodesById[nodeId]
  if (candidate) {
    return candidate
  }

  const fallbackId = state.selectedNodeId ?? state.session.selectedNodeId ?? null
  return fallbackId ? state.nodesById[fallbackId] ?? null : null
}

export function getDashboardEvents(state, nodeId = null) {
  if (nodeId) {
    return state.eventsByNodeId[nodeId] ?? []
  }

  return state.activityFeed
}

export function getDashboardRounds(state, nodeId = null) {
  if (nodeId) {
    return state.roundsByNodeId[nodeId] ?? []
  }

  return Object.values(state.roundsByNodeId).flat()
}

export function createDashboardStore({
  api = createDashboardApi(),
  socketFactory = createDashboardSocket,
} = {}) {
  let state = createEmptyDashboardState()
  let listeners = new Set()
  let socket = null
  let bootstrapPromise = null
  let started = false

  const notify = () => {
    listeners.forEach((listener) => listener())
  }

  const setState = (nextState) => {
    state = typeof nextState === 'function' ? nextState(state) : nextState
    notify()
  }

  const handleSocketMessage = (message) => {
    state = applyDashboardMessage(state, message)
    notify()
  }

  const handleSocketStatus = ({ status, detail, url }) => {
    state = {
      ...state,
      connection: {
        ...state.connection,
        status: status === 'open' ? 'live' : status,
        detail: detail ?? (status === 'open' ? 'Connected to live telemetry socket' : state.connection.detail),
        url: url ?? state.connection.url,
        lastError: status === 'open' ? state.connection.lastError : (detail ?? state.connection.lastError),
        lastConnectedAt: status === 'open' ? new Date().toISOString() : state.connection.lastConnectedAt,
      },
    }
    notify()
  }

  const connectSocket = () => {
    if (!socketFactory || !api.socketUrl) {
      return
    }

    socket?.close?.()
    socket = socketFactory({
      url: api.socketUrl,
      onMessage: handleSocketMessage,
      onStatus: handleSocketStatus,
    })
    socket.connect?.()
  }

  const hydrate = async () => {
    setState((current) => ({
      ...current,
      connection: {
        ...current.connection,
        status: 'loading',
        detail: 'Loading dashboard bootstrap',
        url: api.socketUrl,
      },
    }))

    try {
      const bootstrap = await api.fetchDashboardBootstrap()
      state = buildDashboardState(bootstrap)
      notify()

      if (bootstrap.mode === 'demo' || bootstrap.source === 'demo') {
        state = {
          ...state,
          connection: {
            ...state.connection,
            status: 'demo',
            detail: 'Telemetry service unavailable; showing demo snapshot',
            mode: 'demo',
          },
        }
        notify()
        return state
      }

      state = {
        ...state,
        connection: {
          ...state.connection,
          status: ['ready', 'idle'].includes(state.connection.status) ? 'connecting' : state.connection.status,
          detail: ['ready', 'idle'].includes(state.connection.status)
            ? 'Opening live telemetry socket'
            : state.connection.detail,
          mode: 'live',
        },
      }
      notify()

      connectSocket()
      return state
    } catch {
      const demoState = buildDashboardState(createDemoDashboardSnapshot())
      state = {
        ...demoState,
        connection: {
          ...demoState.connection,
          status: 'demo',
          detail: 'Telemetry service unavailable; showing demo snapshot',
          mode: 'demo',
        },
        source: 'demo',
      }
      notify()
      return state
    }
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async start() {
      if (started && bootstrapPromise) {
        return bootstrapPromise
      }

      started = true
      bootstrapPromise = hydrate().finally(() => {
        bootstrapPromise = null
      })

      return bootstrapPromise
    },
    async retry() {
      socket?.close?.()
      socket = null
      started = false
      return this.start()
    },
    stop() {
      socket?.close?.()
      socket = null
      started = false
    },
    selectNode(nodeId) {
      state = {
        ...state,
        selectedNodeId: nodeId,
      }
      notify()
    },
  }
}

export const dashboardStore = createDashboardStore()

export function useDashboardState(selector = (value) => value) {
  return useSyncExternalStore(
    dashboardStore.subscribe,
    () => selector(dashboardStore.getState()),
    () => selector(dashboardStore.getState()),
  )
}

export {
  createEmptyDashboardState,
  createDemoDashboardSnapshot,
}
