import { useEffect, useMemo, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import {
  dashboardStore,
  getDashboardNodes,
  getDashboardSwarms,
  useDashboardState,
} from "../../../lib/dashboardState";
import {
  formatDecimal,
  formatNumber,
  formatPercent,
  nodeDisplayStatus,
  relativeAge,
  statusTone,
} from "../../lib/dashboardUi";

const WIDTH = 1100;
const HEIGHT = 600;
const SWARM_COLORS = ["#F5C86B", "#7CC4FF", "#C28BFF", "#4ADE80", "#F87171"];
const NODE_SPACING = 72;
const MIN_NODE_DISTANCE = 54;
const SWARM_MARGIN = 104;

function projectGraphNode(node, index, total) {
  const rawX = Number(node?.x);
  const rawY = Number(node?.y);
  if (Number.isFinite(rawX) && Number.isFinite(rawY)) {
    const normalizedX = rawX <= 100 ? rawX / 100 : rawX / WIDTH;
    const normalizedY = rawY <= 100 ? rawY / 100 : rawY / HEIGHT;
    return {
      x: Math.max(80, Math.min(WIDTH - 80, normalizedX * WIDTH)),
      y: Math.max(80, Math.min(HEIGHT - 80, normalizedY * HEIGHT)),
    };
  }

  const angle = (Math.PI * 2 * index) / Math.max(1, total);
  return {
    x: WIDTH / 2 + Math.cos(angle) * 260,
    y: HEIGHT / 2 + Math.sin(angle) * 190,
  };
}

function distributeOverlappingNodes(nodes) {
  const groups = new Map();

  nodes.forEach((node, index) => {
    const key = `${Math.round(node.x / 18)}:${Math.round(node.y / 18)}:${node.swarmId || node.swarmName || "default"}`;
    const group = groups.get(key) || [];
    group.push({ node, index });
    groups.set(key, group);
  });

  const spreadNodes = nodes.map((node) => ({ ...node }));

  groups.forEach((group) => {
    if (group.length < 2) return;

    const centerX = group.reduce((sum, item) => sum + item.node.x, 0) / group.length;
    const centerY = group.reduce((sum, item) => sum + item.node.y, 0) / group.length;
    const radius = Math.max(NODE_SPACING, (group.length * NODE_SPACING) / (Math.PI * 2));

    group.forEach((item, offset) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * offset) / group.length;
      spreadNodes[item.index] = {
        ...spreadNodes[item.index],
        x: Math.max(90, Math.min(WIDTH - 90, centerX + Math.cos(angle) * radius)),
        y: Math.max(90, Math.min(HEIGHT - 90, centerY + Math.sin(angle) * radius)),
      };
    });
  });

  for (let pass = 0; pass < 5; pass += 1) {
    for (let i = 0; i < spreadNodes.length; i += 1) {
      for (let j = i + 1; j < spreadNodes.length; j += 1) {
        const a = spreadNodes[i];
        const b = spreadNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance >= MIN_NODE_DISTANCE) continue;

        const push = (MIN_NODE_DISTANCE - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;

        a.x = Math.max(80, Math.min(WIDTH - 80, a.x - ux * push));
        a.y = Math.max(80, Math.min(HEIGHT - 80, a.y - uy * push));
        b.x = Math.max(80, Math.min(WIDTH - 80, b.x + ux * push));
        b.y = Math.max(80, Math.min(HEIGHT - 80, b.y + uy * push));
      }
    }
  }

  return spreadNodes;
}

function getNodeSwarmKey(node) {
  return node.swarmId || node.swarmName || "default-swarm";
}

function getSwarmNodeRadius(count) {
  if (count <= 1) return 0;
  return Math.max(54, Math.sqrt(count) * 28);
}

function getSwarmHaloRadius(count) {
  return getSwarmNodeRadius(count) + 76;
}

function buildSwarmCenters(swarmGroups) {
  if (!swarmGroups.length) return new Map();

  const centers = new Map();
  if (swarmGroups.length === 1) {
    centers.set(swarmGroups[0].id, { x: WIDTH / 2, y: HEIGHT / 2 });
    return centers;
  }

  const largestHalo = Math.max(...swarmGroups.map((group) => group.haloRadius));
  const orbit = Math.max(largestHalo + 92, Math.min(WIDTH, HEIGHT) * 0.28);

  swarmGroups.forEach((group, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / swarmGroups.length;
    centers.set(group.id, {
      x: WIDTH / 2 + Math.cos(angle) * orbit,
      y: HEIGHT / 2 + Math.sin(angle) * orbit,
    });
  });

  return centers;
}

function applySwarmLayout(nodes, swarmMeta) {
  const swarmOrder = swarmMeta.map((swarm) => swarm.id);
  const groupsById = new Map();

  nodes.forEach((node) => {
    const id = getNodeSwarmKey(node);
    const group = groupsById.get(id) || [];
    group.push(node);
    groupsById.set(id, group);
    if (!swarmOrder.includes(id)) swarmOrder.push(id);
  });

  const swarmGroups = swarmOrder
    .map((id) => {
      const groupNodes = groupsById.get(id) || [];
      return {
        id,
        nodes: groupNodes,
        haloRadius: getSwarmHaloRadius(groupNodes.length),
      };
    })
    .filter((group) => group.nodes.length);

  const centers = buildSwarmCenters(swarmGroups);

  const laidOut = swarmGroups.flatMap((group) => {
    const center = centers.get(group.id) || { x: WIDTH / 2, y: HEIGHT / 2 };
    const count = group.nodes.length;
    const nodeRadius = getSwarmNodeRadius(count);

    if (count === 1) {
      return [{ ...group.nodes[0], x: center.x, y: center.y }];
    }

    return group.nodes.map((node, index) => {
      const ring = Math.floor(Math.sqrt(index));
      const ringStart = ring * ring;
      const ringEnd = (ring + 1) * (ring + 1);
      const ringCount = Math.max(1, ringEnd - ringStart);
      const ringIndex = index - ringStart;
      const radius = Math.max(42, (nodeRadius * (ring + 1)) / Math.max(2, Math.ceil(Math.sqrt(count))));
      const angle = (-Math.PI / 2) + (Math.PI * 2 * ringIndex) / ringCount + ring * 0.37;

      return {
        ...node,
        x: Math.max(SWARM_MARGIN, Math.min(WIDTH - SWARM_MARGIN, center.x + Math.cos(angle) * radius)),
        y: Math.max(SWARM_MARGIN, Math.min(HEIGHT - SWARM_MARGIN, center.y + Math.sin(angle) * radius)),
      };
    });
  });

  return distributeOverlappingNodes(laidOut);
}

function buildSwarmMeta(nodes, swarms) {
  const ids = Array.from(new Set([
    ...swarms.map((swarm) => swarm.swarmId).filter(Boolean),
    ...nodes.map((node) => node.swarmId || node.swarmName).filter(Boolean),
  ]));

  return ids.map((id, index) => {
    const swarm = swarms.find((item) => item.swarmId === id);
    return {
      id,
      label: swarm?.swarmName || id,
      color: SWARM_COLORS[index % SWARM_COLORS.length],
      peerCount: nodes.filter((node) => getNodeSwarmKey(node) === id).length,
    };
  });
}

function isNodeOnline(node) {
  return statusTone(nodeDisplayStatus(node)) === "success";
}

function drawArrowHead(ctx, from, to, color) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 8;
  ctx.save();
  ctx.translate(to.x, to.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function Topology() {
  const state = useDashboardState();
  const nodes = getDashboardNodes(state);
  const swarms = getDashboardSwarms(state);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: WIDTH, height: HEIGHT, dpr: 1 });
  const graphFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const animationRef = useRef(0);

  const swarmMeta = useMemo(() => buildSwarmMeta(nodes, swarms), [nodes, swarms]);
  const swarmById = useMemo(() => new Map(swarmMeta.map((swarm) => [swarm.id, swarm])), [swarmMeta]);
  const graphNodes = useMemo(() => {
    const graphNodeById = new Map(state.network.nodes.map((node) => [node.id, node]));
    const projectedNodes = nodes.map((node, index) => ({
      ...node,
      ...projectGraphNode(graphNodeById.get(node.nodeId), index, nodes.length),
    }));
    return applySwarmLayout(projectedNodes, swarmMeta);
  }, [nodes, state.network.nodes, swarmMeta]);
  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.nodeId, node])), [graphNodes]);
  const graphEdges = useMemo(() => state.network.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target)), [state.network.edges, nodeById]);
  const selectedNode = state.selectedNodeId;
  const activeEdgeCount = graphEdges.filter((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    return source && target && isNodeOnline(source) && isNodeOnline(target);
  }).length;

  const onlineCount = nodes.filter((node) => node.running).length;
  const offlineCount = nodes.filter((node) => !node.running || node.status === "offline").length;
  const staleCount = nodes.filter((node) => node.status === "offline").length;
  const metrics = [
    { label: "Socket", value: state.connection.status, status: statusTone(state.connection.status) },
    { label: "Online nodes", value: formatNumber(onlineCount), status: "normal" },
    { label: "Offline nodes", value: formatNumber(offlineCount), status: offlineCount ? "warning" : "normal" },
    { label: "Stale nodes", value: formatNumber(staleCount), status: staleCount ? "warning" : "normal" },
    { label: "Active edges", value: formatNumber(activeEdgeCount), status: "normal" },
    { label: "Last update", value: relativeAge(state.session.lastUpdatedAt ?? state.connection.lastConnectedAt), status: statusTone(state.connection.status) },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(360, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      setCanvasSize({ width, height, dpr });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hexToRgb = (hex) => {
      const v = hex.replace("#", "");
      return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
    };

    const draw = () => {
      ctx.setTransform(canvasSize.dpr, 0, 0, canvasSize.dpr, 0, 0);
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.save();
      ctx.translate(canvasSize.width / 2 + pan.x, canvasSize.height / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-WIDTH / 2, -HEIGHT / 2);

      swarmMeta.forEach((swarm) => {
        const swarmNodes = graphNodes.filter((node) => getNodeSwarmKey(node) === swarm.id);
        if (!swarmNodes.length) return;
        const cx = swarmNodes.reduce((sum, node) => sum + node.x, 0) / swarmNodes.length;
        const cy = swarmNodes.reduce((sum, node) => sum + node.y, 0) / swarmNodes.length;
        const radius = Math.max(getSwarmHaloRadius(swarmNodes.length), Math.max(...swarmNodes.map((node) => Math.hypot(node.x - cx, node.y - cy))) + 62);
        const c = hexToRgb(swarm.color);
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.14)`);
        grad.addColorStop(0.6, `rgba(${c.r}, ${c.g}, ${c.b}, 0.05)`);
        grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.35)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.85)`;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(swarm.label.toUpperCase(), cx - radius + 6, cy - radius + 14);
      });

      graphEdges.forEach((edge) => {
        const a = nodeById.get(edge.source);
        const b = nodeById.get(edge.target);
        if (!a || !b) return;
        const sourceOnline = isNodeOnline(a);
        const targetOnline = isNodeOnline(b);
        const liveEdge = sourceOnline && targetOnline && (edge.edgeType === "model_transfer" || edge.exchangeCount);
        const swarm = swarmById.get(getNodeSwarmKey(a));
        const c = hexToRgb(swarm?.color || "#F5C86B");
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;
        const ux = dx / distance;
        const uy = dy / distance;
        const source = { x: a.x + ux * 14, y: a.y + uy * 14 };
        const target = { x: b.x - ux * 14, y: b.y - uy * 14 };
        const alpha = liveEdge ? 0.68 : sourceOnline || targetOnline ? 0.28 : 0.12;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
        ctx.lineWidth = liveEdge ? 2.2 : 1.1;
        ctx.lineCap = "round";
        if (liveEdge) {
          ctx.setLineDash([10, 7]);
          ctx.lineDashOffset = -((performance.now() / 80) % 17);
        } else {
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = 0;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        if (liveEdge) {
          drawArrowHead(ctx, source, target, `rgba(${c.r}, ${c.g}, ${c.b}, 0.78)`);
        }
      });

      const time = performance.now() / 600;
      graphNodes.forEach((node) => {
        const status = nodeDisplayStatus(node);
        const tone = statusTone(status);
        const swarm = swarmById.get(getNodeSwarmKey(node));
        const c = hexToRgb(swarm?.color || "#F5C86B");
        const isSelected = selectedNode === node.nodeId;
        const radius = isSelected ? 11 : 7;
        if (tone === "success") {
          const pulse = (Math.sin(time + node.x * 0.01) + 1) / 2;
          ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.35 - pulse * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6 + pulse * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.25)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = tone === "success" ? "#4ADE80" : tone === "danger" ? "#F87171" : "#FBBF24";
        ctx.fill();
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.95)`;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = "#F2EDE4";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.nodeId, node.x, node.y - radius - 6);
      });

      if (!graphNodes.length) {
        ctx.fillStyle = "#6B5F50";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for topology telemetry", WIDTH / 2, HEIGHT / 2);
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize, graphNodes, graphEdges, nodeById, pan, selectedNode, swarmById, swarmMeta, zoom]);

  const eventToGraphPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    return {
      x: (cx - canvasSize.width / 2 - pan.x) / zoom + WIDTH / 2,
      y: (cy - canvasSize.height / 2 - pan.y) / zoom + HEIGHT / 2,
    };
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    setPan({ x: drag.startPanX + dx, y: drag.startPanY + dy });
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);

    if (drag?.moved) return;
    const point = eventToGraphPoint(event);
    if (!point) return;

    const clicked = graphNodes.find((node) => Math.hypot(point.x - node.x, point.y - node.y) < 18);
    dashboardStore.selectNode(clicked ? clicked.nodeId : null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    const frame = graphFrameRef.current;
    if (!frame) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await frame.requestFullscreen();
  };

  const selectedNodeData = selectedNode ? nodeById.get(selectedNode) : null;
  const selectedSwarm = selectedNodeData ? swarmById.get(selectedNodeData.swarmId || selectedNodeData.swarmName) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
              <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
              <div className={`text-sm mono ${metric.status === "success" ? "text-[var(--success)]" : metric.status === "warning" ? "text-[var(--warning)]" : metric.status === "danger" ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 relative">
        <div ref={graphFrameRef} className="h-full min-h-[420px] bg-[var(--surface)] border border-[var(--border)] rounded relative overflow-hidden fullscreen:bg-[var(--surface)]">
          <canvas
            ref={canvasRef}
            className={`w-full h-full touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          <div className="absolute top-4 right-4 flex items-center gap-2 bg-[var(--bg-elevated)]/95 border border-[var(--border)] rounded p-1.5">
            <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} className="p-1.5 hover:bg-[var(--surface)] rounded transition-colors" title="Zoom out">
              <ZoomOut className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-[var(--surface)] rounded transition-colors" title="Fullscreen">
              <Maximize2 className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))} className="p-1.5 hover:bg-[var(--surface)] rounded transition-colors" title="Zoom in">
              <ZoomIn className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <div className="w-px h-4 bg-[var(--border)]" />
            <button onClick={resetView} className="p-1.5 hover:bg-[var(--surface)] rounded transition-colors" title="Reset view">
              <RotateCcw className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <div className="px-2 text-xs text-[var(--text-muted)] mono">{Math.round(zoom * 100)}%</div>
          </div>

          <div className="absolute top-4 left-4 bg-[var(--bg-elevated)]/95 border border-[var(--border)] rounded p-3 space-y-1.5">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Swarms</div>
            {swarmMeta.length ? swarmMeta.map((swarm) => {
          const count = graphNodes.filter((node) => getNodeSwarmKey(node) === swarm.id).length;
              return (
                <div key={swarm.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: swarm.color }} />
                  <span className="text-xs text-[var(--text-secondary)] mono">{swarm.label}</span>
                  <span className="text-xs text-[var(--text-muted)] mono ml-auto">{count}</span>
                </div>
              );
            }) : <div className="text-xs text-[var(--text-muted)]">No swarms</div>}
          </div>

          <div className="absolute bottom-4 left-4 bg-[var(--bg-elevated)]/95 border border-[var(--border)] rounded p-3 space-y-2">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Legend</div>
            <div className="flex items-center gap-2"><div className="w-3 h-0.5 border-t border-dashed border-[var(--gold-mid)]/40" /><span className="text-xs text-[var(--text-secondary)]">Peer link</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[var(--gold-mid)]/80" /><span className="text-xs text-[var(--text-secondary)]">Active transfer</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--success)]" /><span className="text-xs text-[var(--text-secondary)]">Online</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--warning)]" /><span className="text-xs text-[var(--text-secondary)]">Idle</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--danger)]" /><span className="text-xs text-[var(--text-secondary)]">Offline</span></div>
          </div>

          {selectedNodeData && (
            <div className="hidden xl:block absolute bottom-4 right-4 w-72 bg-[var(--bg-elevated)]/95 border border-[var(--border)] rounded p-4 space-y-3">
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Selected Node</div>
                <div className="text-sm text-[var(--text-primary)] mono mb-1">{selectedNodeData.nodeId}</div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusTone(nodeDisplayStatus(selectedNodeData)) === "success" ? "bg-[var(--success)]" : statusTone(nodeDisplayStatus(selectedNodeData)) === "danger" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`} />
                  <span className="text-xs text-[var(--text-secondary)]">{nodeDisplayStatus(selectedNodeData)}</span>
                  {selectedSwarm && <><span className="text-[var(--text-muted)]">·</span><span className="w-2 h-2 rounded-full" style={{ background: selectedSwarm.color }} /><span className="text-xs text-[var(--text-secondary)] mono">{selectedSwarm.label}</span></>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-[var(--text-muted)] mb-0.5">Round</div><div className="text-xs text-[var(--text-primary)] mono">{formatNumber(selectedNodeData.currentRound)}</div></div>
                <div><div className="text-xs text-[var(--text-muted)] mb-0.5">Peers</div><div className="text-xs text-[var(--text-primary)] mono">{formatNumber(selectedNodeData.knownPeerCount)}</div></div>
                <div><div className="text-xs text-[var(--text-muted)] mb-0.5">Accuracy</div><div className="text-xs text-[var(--success)] mono">{formatPercent(selectedNodeData.lastAccuracy)}</div></div>
                <div><div className="text-xs text-[var(--text-muted)] mb-0.5">Loss</div><div className="text-xs text-[var(--text-primary)] mono">{formatDecimal(selectedNodeData.lastLoss)}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
