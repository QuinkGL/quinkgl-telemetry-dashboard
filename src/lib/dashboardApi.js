const DEFAULT_API_BASE = import.meta.env?.VITE_QUINKGL_DASHBOARD_API_BASE || '/api'

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function joinUrl(base, path) {
  if (!base) {
    return path
  }

  return `${trimTrailingSlash(base)}${path}`
}

async function readJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`)
  }

  return response.json()
}

function formatIso(value) {
  return new Date(value).toISOString()
}

export function createDemoDashboardSnapshot() {
  const now = '2026-04-07T09:45:00.000Z'

  return {
    mode: 'demo',
    source: 'demo',
    session: {
      session_id: 'demo-session',
      started_at: '2026-04-07T09:00:00.000Z',
      active_node_count: 3,
      domain_summary: [
        { domain: 'healthcare:xray:chest', node_count: 2 },
        { domain: 'finance:fraud', node_count: 1 },
      ],
      last_updated_at: now,
    },
    nodes: [
      {
        node_id: 'node-alpha',
        domain: 'healthcare:xray:chest',
        connection_mode: 'ipv8',
        running: true,
        current_round: 18,
        known_peer_count: 3,
        peer_ids: ['node-beta', 'node-gamma', 'node-delta'],
        last_seen_at: now,
        last_training_at: '2026-04-07T09:44:30.000Z',
        last_send_at: '2026-04-07T09:44:42.000Z',
        last_receive_at: '2026-04-07T09:44:51.000Z',
        last_aggregation_at: '2026-04-07T09:44:58.000Z',
        session_started_at: '2026-04-07T09:00:00.000Z',
        uptime_seconds: 2700,
        last_loss: 0.18,
        last_accuracy: 0.94,
        last_samples_trained: 24,
        training_rounds_completed: 18,
        models_sent: 11,
        models_received: 13,
        last_sent_peer_ids: ['node-beta'],
        last_received_peer_id: 'node-gamma',
        aggregations_completed: 15,
        last_aggregation_peer_count: 2,
        last_aggregation_total_samples: 96,
        aggregation_strategy: 'FedAvg',
        chunked_transfers_sent: 2,
        chunked_transfers_received: 1,
        resend_requests: 0,
        send_failures: 0,
        swarm_id: 'demo-swarm-001',
        swarm_name: 'MNIST-FedAvg',
        manifest_hash: 'sha256:abc123def456...',
      },
      {
        node_id: 'node-beta',
        domain: 'healthcare:xray:chest',
        connection_mode: 'ipv8',
        running: true,
        current_round: 16,
        known_peer_count: 2,
        peer_ids: ['node-alpha', 'node-gamma'],
        last_seen_at: now,
        last_training_at: '2026-04-07T09:44:12.000Z',
        last_send_at: '2026-04-07T09:44:27.000Z',
        last_receive_at: '2026-04-07T09:44:37.000Z',
        last_aggregation_at: '2026-04-07T09:44:45.000Z',
        session_started_at: '2026-04-07T09:05:00.000Z',
        uptime_seconds: 2400,
        last_loss: 0.22,
        last_accuracy: 0.91,
        last_samples_trained: 20,
        training_rounds_completed: 16,
        models_sent: 9,
        models_received: 11,
        last_sent_peer_ids: ['node-alpha'],
        last_received_peer_id: 'node-gamma',
        aggregations_completed: 12,
        last_aggregation_peer_count: 2,
        last_aggregation_total_samples: 84,
        aggregation_strategy: 'FedAvg',
        chunked_transfers_sent: 1,
        chunked_transfers_received: 1,
        resend_requests: 1,
        send_failures: 0,
        swarm_id: 'demo-swarm-001',
        swarm_name: 'MNIST-FedAvg',
        manifest_hash: 'sha256:abc123def456...',
      },
      {
        node_id: 'node-gamma',
        domain: 'finance:fraud',
        connection_mode: 'ipv8',
        running: false,
        current_round: 12,
        known_peer_count: 1,
        peer_ids: ['node-alpha'],
        last_seen_at: '2026-04-07T09:40:11.000Z',
        last_training_at: '2026-04-07T09:40:02.000Z',
        last_send_at: '2026-04-07T09:40:25.000Z',
        last_receive_at: '2026-04-07T09:40:29.000Z',
        last_aggregation_at: '2026-04-07T09:40:32.000Z',
        session_started_at: '2026-04-07T08:58:00.000Z',
        uptime_seconds: 1200,
        last_loss: 0.33,
        last_accuracy: 0.87,
        last_samples_trained: 16,
        training_rounds_completed: 12,
        models_sent: 6,
        models_received: 7,
        last_sent_peer_ids: ['node-alpha'],
        last_received_peer_id: 'node-alpha',
        aggregations_completed: 8,
        last_aggregation_peer_count: 1,
        last_aggregation_total_samples: 64,
        aggregation_strategy: 'TrimmedMean',
        chunked_transfers_sent: 0,
        chunked_transfers_received: 1,
        resend_requests: 0,
        send_failures: 1,
        swarm_id: 'demo-swarm-001',
        swarm_name: 'MNIST-FedAvg',
        manifest_hash: 'sha256:abc123def456...',
      },
    ],
    events: [
      {
        id: 'evt-001',
        node_id: 'node-alpha',
        event_type: 'training_completed',
        timestamp: '2026-04-07T09:44:30.000Z',
        payload: { loss: 0.18, accuracy: 0.94, samples_trained: 24 },
      },
      {
        id: 'evt-002',
        node_id: 'node-alpha',
        event_type: 'model_sent',
        timestamp: '2026-04-07T09:44:42.000Z',
        payload: { peer_id: 'node-beta', sample_count: 24 },
      },
      {
        id: 'evt-003',
        node_id: 'node-beta',
        event_type: 'aggregation_completed',
        timestamp: '2026-04-07T09:44:45.000Z',
        payload: { peer_count: 2, total_samples: 84, strategy_name: 'FedAvg' },
      },
      {
        id: 'evt-004',
        node_id: 'node-gamma',
        event_type: 'model_received',
        timestamp: '2026-04-07T09:40:29.000Z',
        payload: { peer_id: 'node-alpha', sample_count: 16 },
      },
    ],
    rounds: [
      {
        node_id: 'node-alpha',
        round: 18,
        timestamp: '2026-04-07T09:44:58.000Z',
        loss: 0.18,
        accuracy: 0.94,
        samples_trained: 24,
      },
      {
        node_id: 'node-beta',
        round: 16,
        timestamp: '2026-04-07T09:44:45.000Z',
        loss: 0.22,
        accuracy: 0.91,
        samples_trained: 20,
      },
      {
        node_id: 'node-gamma',
        round: 12,
        timestamp: '2026-04-07T09:40:32.000Z',
        loss: 0.33,
        accuracy: 0.87,
        samples_trained: 16,
      },
    ],
    network: {
      nodes: [
        { node_id: 'node-alpha', x: 20, y: 20 },
        { node_id: 'node-beta', x: 72, y: 28 },
        { node_id: 'node-gamma', x: 44, y: 74 },
      ],
      edges: [
        {
          id: 'node-alpha-node-beta',
          source: 'node-alpha',
          target: 'node-beta',
          weight: 0.88,
          last_seen_at: now,
        },
        {
          id: 'node-alpha-node-gamma',
          source: 'node-alpha',
          target: 'node-gamma',
          weight: 0.61,
          last_seen_at: now,
        },
        {
          id: 'node-beta-node-gamma',
          source: 'node-beta',
          target: 'node-gamma',
          weight: 0.57,
          last_seen_at: now,
        },
      ],
      stats: {
        active_edge_count: 3,
        message_volume: 42,
        peer_churn: 1,
        chunked_transfer_count: 4,
        retry_count: 1,
      },
    },
    swarms: [
      {
        swarm_id: 'demo-swarm-001',
        swarm_name: 'MNIST-FedAvg',
        manifest_hash: 'sha256:abc123def456...',
        description: 'MNIST classification with FedAvg aggregation',
        peer_count: 3,
        aggregation_name: 'FedAvg',
        topology_name: 'Random',
        task_type: 'classification',
        input_shape: [1, 28, 28],
        output_shape: [10],
        label_type: 'integer',
        round_limit: 100,
        created_at: '2026-04-07T09:00:00Z',
        domains: ['healthcare:xray:chest', 'finance:fraud'],
      },
    ],
  }
}

function isMeaningful(value) {
  if (value == null) {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }

  return true
}

export function createDashboardApi({ baseUrl = DEFAULT_API_BASE } = {}) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl)
  const socketUrl = joinUrl(normalizedBaseUrl, '/ws')

  const fetchJson = async (path, fallback) => {
    try {
      return await readJson(joinUrl(normalizedBaseUrl, path))
    } catch {
      return fallback
    }
  }

  const fetchMaybe = async (path, fallback) => {
    const value = await fetchJson(path, fallback)
    return value ?? fallback
  }

  return {
    baseUrl: normalizedBaseUrl,
    socketUrl,
    fetchSession: () => fetchMaybe('/session', null),
    fetchNodes: () => fetchMaybe('/nodes', []),
    fetchNode: (nodeId) => fetchMaybe(`/nodes/${encodeURIComponent(nodeId)}`, null),
    fetchNodeEvents: (nodeId) => fetchMaybe(`/nodes/${encodeURIComponent(nodeId)}/events`, []),
    fetchNodeRounds: (nodeId) => fetchMaybe(`/nodes/${encodeURIComponent(nodeId)}/rounds`, []),
    fetchNetworkGraph: () => fetchMaybe('/network/graph', { nodes: [], edges: [] }),
    fetchNetworkStats: () => fetchMaybe('/network/stats', {}),
    fetchSwarms: () => fetchMaybe('/swarms', []),
    fetchSwarmManifest: (swarmId) => fetchJson(`/swarms/${encodeURIComponent(swarmId)}/manifest`, null),
    async fetchDashboardBootstrap() {
      const [session, nodes, events, rounds, networkGraph, networkStats, swarms] = await Promise.all([
        fetchJson('/session', null),
        fetchJson('/nodes', []),
        fetchJson('/events', []),
        fetchJson('/rounds', []),
        fetchJson('/network/graph', { nodes: [], edges: [] }),
        fetchJson('/network/stats', {}),
        fetchJson('/swarms', []),
      ])

      const liveSnapshot = {
        mode: 'live',
        source: 'live',
        session,
        nodes,
        events,
        rounds,
        swarms,
        network: {
          ...networkGraph,
          stats: networkStats,
        },
      }

      const hasLiveData = [session, nodes, events, rounds, networkGraph, networkStats].some(isMeaningful)
      if (!hasLiveData) {
        return createDemoDashboardSnapshot()
      }

      return liveSnapshot
    },
    createDemoDashboardSnapshot,
  }
}

export function formatDashboardTimestamp(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return formatIso(date)
}
