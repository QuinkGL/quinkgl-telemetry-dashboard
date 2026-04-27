# QuinkGL Dashboard

Real-time telemetry dashboard for the QuinkGL decentralized gossip-learning framework.

## Overview

This React + Vite application provides live observability into QuinkGL swarms, nodes, training rounds, and network topology. It connects to a QuinkGL telemetry backend via REST API and WebSocket.

## Features

- **Overview** — Session health, active nodes, training convergence, and event timeline
- **Swarms** — Active swarm manifests with peer counts and aggregation strategies
- **Topology** — Interactive Sigma.js network graph with live model-transfer flow
- **Nodes** — Per-node roster, peer inventory, and runtime posture
- **Training** — Global and per-node training metrics, round history
- **Activity** — Real-time event stream with filtering

## Tech Stack

- React 19 + Vite 7
- Tailwind CSS 4
- Sigma.js + Graphology (network graph)
- Lucide React (icons)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_QUINKGL_DASHBOARD_API_BASE` | Telemetry API base URL. Example: `https://your-telemetry-server.io/api` |
| `QUINKGL_TELEMETRY_DEV_URL` | Dev proxy target for `/api` and `/api/ws`. Default: `http://127.0.0.1:8765` |

## Build

```bash
npm run build
```

## License

Apache-2.0
