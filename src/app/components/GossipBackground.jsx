import { useEffect, useRef } from 'react';
import earthTexture from '../../imports/earth.jpg';

const EARTH_RADIUS = 280;
const ROTATION = Math.PI / 2 + (20 * Math.PI) / 180;

const permanentCities = [
  { lat: 39.7392, lon: -104.9903, city: 'Denver' },
  { lat: 41.8781, lon: -87.6298, city: 'Chicago' },
  { lat: 19.4326, lon: -99.1332, city: 'Mexico City' },
  { lat: -15.7939, lon: -47.8828, city: 'Brasilia' },
  { lat: -31.4201, lon: -64.1888, city: 'Cordoba' },
  { lat: 52.52, lon: 13.405, city: 'Berlin' },
  { lat: 48.8566, lon: 2.3522, city: 'Paris' },
  { lat: 40.4168, lon: -3.7038, city: 'Madrid' },
  { lat: 39.9334, lon: 32.8597, city: 'Ankara' },
  { lat: 55.7558, lon: 37.6173, city: 'Moscow' },
  { lat: 39.9042, lon: 116.4074, city: 'Beijing' },
  { lat: 28.6139, lon: 77.209, city: 'New Delhi' },
  { lat: 13.7563, lon: 100.5018, city: 'Bangkok' },
  { lat: 30.0444, lon: 31.2357, city: 'Cairo' },
  { lat: -4.4419, lon: 15.2663, city: 'Kinshasa' },
  { lat: -23.698, lon: 133.8807, city: 'Alice Springs' },
];

const temporaryLocations = [
  { lat: 32.7767, lon: -96.797, city: 'Dallas' },
  { lat: 49.8951, lon: -97.1384, city: 'Winnipeg' },
  { lat: 45.5017, lon: -73.5673, city: 'Montreal' },
  { lat: 4.711, lon: -74.0721, city: 'Bogota' },
  { lat: -16.5, lon: -68.15, city: 'La Paz' },
  { lat: 52.2297, lon: 21.0122, city: 'Warsaw' },
  { lat: 48.1351, lon: 11.582, city: 'Munich' },
  { lat: 47.4979, lon: 19.0402, city: 'Budapest' },
  { lat: 43.2389, lon: 76.945, city: 'Almaty' },
  { lat: 31.5204, lon: 74.3587, city: 'Lahore' },
  { lat: 29.563, lon: 106.5516, city: 'Chongqing' },
  { lat: 47.918, lon: 106.917, city: 'Ulaanbaatar' },
  { lat: 15.5007, lon: 32.5599, city: 'Khartoum' },
  { lat: -1.2921, lon: 36.8219, city: 'Nairobi' },
  { lat: -26.2041, lon: 28.0473, city: 'Johannesburg' },
  { lat: -35.2809, lon: 149.13, city: 'Canberra' },
  { lat: -25.3444, lon: 131.0369, city: 'Uluru' },
];

const swarmPalette = [
  { r: 245, g: 200, b: 107 },
  { r: 124, g: 196, b: 255 },
  { r: 194, g: 139, b: 255 },
  { r: 130, g: 230, b: 170 },
  { r: 255, g: 160, b: 130 },
];

function latLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function projectPoint(point, centerX, centerY) {
  const cosRot = Math.cos(ROTATION);
  const sinRot = Math.sin(ROTATION);
  const x = point.x * cosRot - point.z * sinRot;
  const z = point.z * cosRot + point.x * sinRot;

  point.screenX = centerX + x;
  point.screenY = centerY - point.y;
  point.visible = z > -EARTH_RADIUS * 0.3;
}

function makePoint(location, permanent, centerX, centerY) {
  const { x, y, z } = latLonToXYZ(location.lat, location.lon, EARTH_RADIUS);
  const point = {
    ...location,
    x,
    y,
    z,
    screenX: 0,
    screenY: 0,
    visible: false,
    pulsePhase: Math.random() * Math.PI * 2,
    permanent,
    opacity: permanent ? 1 : 0,
    lifetime: permanent ? undefined : 0,
    maxLifetime: permanent ? undefined : 180 + Math.random() * 120,
    swarmId: null,
    swarmTimer: 0,
  };
  projectPoint(point, centerX, centerY);
  return point;
}

export function GossipBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationId = 0;
    let centerX = 0;
    let centerY = 0;
    let earthImage = null;
    let imageLoaded = false;
    let earthRendered = false;
    let points = [];
    let connections = [];
    let trainingTicks = [];
    let ripples = [];
    let swarms = [];
    let nextSwarmId = 1;
    let staticStars = [];

    const earthCanvas = document.createElement('canvas');
    const starsCanvas = document.createElement('canvas');

    const renderStarsToCache = () => {
      starsCanvas.width = window.innerWidth;
      starsCanvas.height = window.innerHeight;
      const sctx = starsCanvas.getContext('2d');
      if (!sctx) return;
      sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      staticStars.forEach((star) => {
        sctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        sctx.fillRect(star.x, star.y, star.size, star.size);
      });
    };

    const initStaticStars = () => {
      staticStars = Array.from({ length: 350 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.5 + Math.random() * 1.1,
        alpha: 0.3 + Math.random() * 0.55,
      }));
      renderStarsToCache();
    };

    const renderEarthToCache = () => {
      if (!earthImage || !imageLoaded) return;
      const size = Math.ceil((EARTH_RADIUS + 30) * 2);
      earthCanvas.width = size;
      earthCanvas.height = size;
      const ectx = earthCanvas.getContext('2d');
      if (!ectx) return;
      const cx = size / 2;
      const cy = size / 2;
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = earthImage.width;
      textureCanvas.height = earthImage.height;
      const tctx = textureCanvas.getContext('2d');
      if (!tctx) return;
      tctx.drawImage(earthImage, 0, 0);

      let textureData;
      try {
        textureData = tctx.getImageData(0, 0, earthImage.width, earthImage.height).data;
      } catch {
        return;
      }

      const out = ectx.createImageData(size, size);
      const outData = out.data;
      const cosA = Math.cos(ROTATION);
      const sinA = Math.sin(ROTATION);
      const r2 = EARTH_RADIUS * EARTH_RADIUS;

      for (let py = 0; py < size; py += 1) {
        const dy = py - cy;
        for (let px = 0; px < size; px += 1) {
          const dx = px - cx;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;

          const zCam = Math.sqrt(r2 - d2);
          const xOrig = dx * cosA + zCam * sinA;
          const yOrig = -dy;
          const zOrig = -dx * sinA + zCam * cosA;
          const phi = Math.acos(Math.max(-1, Math.min(1, yOrig / EARTH_RADIUS)));
          let theta = Math.atan2(zOrig, -xOrig);
          if (theta < 0) theta += Math.PI * 2;

          const tx = Math.min(earthImage.width - 1, Math.max(0, Math.floor((theta / (Math.PI * 2)) * earthImage.width)));
          const ty = Math.min(earthImage.height - 1, Math.max(0, Math.floor((phi / Math.PI) * earthImage.height)));
          const src = (ty * earthImage.width + tx) * 4;
          const dst = (py * size + px) * 4;
          outData[dst] = textureData[src];
          outData[dst + 1] = textureData[src + 1];
          outData[dst + 2] = textureData[src + 2];
          outData[dst + 3] = 255;
        }
      }

      ectx.putImageData(out, 0, 0);

      const shadow = ectx.createRadialGradient(
        cx + EARTH_RADIUS * 0.3, cy, EARTH_RADIUS * 0.3,
        cx, cy, EARTH_RADIUS,
      );
      shadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadow.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
      shadow.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ectx.fillStyle = shadow;
      ectx.beginPath();
      ectx.arc(cx, cy, EARTH_RADIUS, 0, Math.PI * 2);
      ectx.fill();

      const atmosphere = ectx.createRadialGradient(cx, cy, EARTH_RADIUS, cx, cy, EARTH_RADIUS + 25);
      atmosphere.addColorStop(0, 'rgba(100, 150, 200, 0.2)');
      atmosphere.addColorStop(0.5, 'rgba(60, 100, 150, 0.1)');
      atmosphere.addColorStop(1, 'rgba(30, 50, 80, 0)');
      ectx.fillStyle = atmosphere;
      ectx.beginPath();
      ectx.arc(cx, cy, EARTH_RADIUS + 25, 0, Math.PI * 2);
      ectx.fill();

      earthRendered = true;
    };

    const initPoints = () => {
      points = permanentCities.map((city) => makePoint(city, true, centerX, centerY));
      connections = Array.from({ length: 2 }, () => {
        const from = Math.floor(Math.random() * points.length);
        let to = Math.floor(Math.random() * points.length);
        while (to === from) to = Math.floor(Math.random() * points.length);
        return {
          from,
          to,
          progress: Math.random(),
          speed: 0.0005 + Math.random() * 0.0006,
          active: true,
          weight: 0.4 + Math.random() * 0.6,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = window.innerWidth / 2;
      centerY = window.innerHeight / 2;
      initPoints();
      initStaticStars();
      renderEarthToCache();
    };

    const spawnTemporaryNode = () => {
      const location = temporaryLocations[Math.floor(Math.random() * temporaryLocations.length)];
      points.push(makePoint(location, false, centerX, centerY));
    };

    const updateTemporaryNodes = () => {
      points = points.filter((point) => {
        if (point.permanent) return true;
        point.lifetime += 1;
        if (point.lifetime < point.maxLifetime * 0.2) {
          point.opacity = point.lifetime / (point.maxLifetime * 0.2);
        } else if (point.lifetime > point.maxLifetime * 0.8) {
          point.opacity = 1 - ((point.lifetime - point.maxLifetime * 0.8) / (point.maxLifetime * 0.2));
        } else {
          point.opacity = 1;
        }
        return point.lifetime < point.maxLifetime;
      });

      if (Math.random() < 0.008 && points.filter((point) => !point.permanent).length < 6) {
        spawnTemporaryNode();
      }
    };

    const updatePoints = () => {
      points.forEach((point) => {
        projectPoint(point, centerX, centerY);
        point.pulsePhase += 0.012;
      });
    };

    const updateConnections = () => {
      connections = connections.filter((connection) => points[connection.from] && points[connection.to]);
      connections.forEach((connection) => {
        const previous = connection.progress;
        connection.progress += connection.speed;
        if (previous < 1 && connection.progress >= 1) {
          const target = points[connection.to];
          if (target) {
            ripples.push({ x: target.screenX, y: target.screenY, age: 0, maxAge: 50, intensity: connection.weight });
          }
        }
        if (connection.progress >= 1) {
          connection.progress = 0;
          if (Math.random() < 0.3 && points.length > 1) {
            let next = Math.floor(Math.random() * points.length);
            while (next === connection.from) next = Math.floor(Math.random() * points.length);
            connection.to = next;
            connection.weight = 0.4 + Math.random() * 0.6;
          }
        }
      });

      if (Math.random() < 0.004 && connections.length < 4 && points.length > 1) {
        const from = Math.floor(Math.random() * points.length);
        let to = Math.floor(Math.random() * points.length);
        while (to === from) to = Math.floor(Math.random() * points.length);
        connections.push({ from, to, progress: 0, speed: 0.0005 + Math.random() * 0.0006, active: true, weight: 0.4 + Math.random() * 0.6 });
      }
    };

    const spawnTrainingTick = () => {
      const candidates = points.map((point, index) => (point.permanent && point.visible ? index : -1)).filter((index) => index >= 0);
      if (!candidates.length) return;
      const pointIndex = candidates[Math.floor(Math.random() * candidates.length)];
      trainingTicks.push({ pointIndex, age: 0, maxAge: 90 });
      if (Math.random() < 0.7 && points.length > 1) {
        let to = Math.floor(Math.random() * points.length);
        while (to === pointIndex) to = Math.floor(Math.random() * points.length);
        connections.push({ from: pointIndex, to, progress: 0, speed: 0.0006 + Math.random() * 0.0007, active: true, weight: 0.5 + Math.random() * 0.5 });
      }
    };

    const updateTrainingTicks = () => {
      trainingTicks = trainingTicks.filter((tick) => {
        tick.age += 1;
        return tick.age < tick.maxAge;
      });
      if (Math.random() < 0.012) spawnTrainingTick();
    };

    const updateRipples = () => {
      ripples = ripples.filter((ripple) => {
        ripple.age += 1;
        return ripple.age < ripple.maxAge;
      });
    };

    const formSwarm = () => {
      const visiblePermanent = points.map((point, index) => ({ point, index })).filter(({ point }) => point.permanent && point.visible);
      if (visiblePermanent.length < 4) return;
      const seed = visiblePermanent[Math.floor(Math.random() * visiblePermanent.length)];
      const members = visiblePermanent
        .map(({ point, index }) => ({ index, distance: Math.hypot(point.screenX - seed.point.screenX, point.screenY - seed.point.screenY) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3 + Math.floor(Math.random() * 3))
        .map(({ index }) => index);
      const id = nextSwarmId;
      nextSwarmId += 1;
      const hue = swarmPalette[Math.floor(Math.random() * swarmPalette.length)];
      members.forEach((index) => {
        points[index].swarmId = id;
        points[index].swarmTimer = 0;
      });
      swarms.push({ members, age: 0, maxAge: 240, hue });
    };

    const updateSwarms = () => {
      swarms = swarms.filter((swarm) => {
        swarm.age += 1;
        if (swarm.age >= swarm.maxAge) {
          swarm.members.forEach((index) => {
            if (points[index]) points[index].swarmId = null;
          });
          return false;
        }
        return true;
      });
      if (Math.random() < 0.004 && swarms.length < 2) formSwarm();
    };

    const drawStars = () => {
      const time = performance.now() / 1000;
      ctx.drawImage(starsCanvas, 0, 0);
      for (let i = 0; i < 5; i += 1) {
        const phase = (time / 4 + i / 5) % 1;
        const envelope = Math.sin(phase * Math.PI);
        if (envelope <= 0.01) continue;
        const slot = Math.floor(time / 4 + i / 5);
        const seed = (slot * 9277 + i * 6151 + 113) >>> 0;
        const x = (((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff) * window.innerWidth;
        const y = (((seed * 22695477 + 1) >>> 0) / 0xffffffff) * window.innerHeight;
        const radius = 1.2 + envelope * 1.6;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
        glow.addColorStop(0, `rgba(255, 245, 220, ${envelope})`);
        glow.addColorStop(0.4, `rgba(255, 230, 180, ${envelope * 0.35})`);
        glow.addColorStop(1, 'rgba(255, 230, 180, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawEarth = () => {
      if (earthRendered) {
        const half = earthCanvas.width / 2;
        ctx.drawImage(earthCanvas, centerX - half, centerY - half);
        return;
      }
      const gradient = ctx.createRadialGradient(centerX - EARTH_RADIUS * 0.3, centerY - EARTH_RADIUS * 0.3, EARTH_RADIUS * 0.3, centerX, centerY, EARTH_RADIUS);
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(0.5, '#050d1a');
      gradient.addColorStop(1, '#020408');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, EARTH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSwarmHalos = () => {
      swarms.forEach((swarm) => {
        const members = swarm.members.map((index) => points[index]).filter((point) => point?.visible);
        if (members.length < 2) return;
        const fade = swarm.age / swarm.maxAge < 0.2 ? swarm.age / (swarm.maxAge * 0.2) : swarm.age / swarm.maxAge > 0.8 ? (1 - swarm.age / swarm.maxAge) / 0.2 : 1;
        const sync = (Math.sin(swarm.age * 0.08) + 1) / 2;
        const { r, g, b } = swarm.hue;
        const cx = members.reduce((sum, point) => sum + point.screenX, 0) / members.length;
        const cy = members.reduce((sum, point) => sum + point.screenY, 0) / members.length;
        const maxDist = Math.max(...members.map((point) => Math.hypot(point.screenX - cx, point.screenY - cy)));
        const halo = ctx.createRadialGradient(cx, cy, maxDist * 0.3, cx, cy, maxDist + 38 + sync * 8);
        halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.18 * fade})`);
        halo.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.08 * fade})`);
        halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, maxDist + 38 + sync * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(0.25 + sync * 0.3) * fade})`;
        ctx.lineWidth = 1;
        members.forEach((a, index) => {
          members.slice(index + 1).forEach((bPoint) => {
            ctx.beginPath();
            ctx.moveTo(a.screenX, a.screenY);
            ctx.lineTo(bPoint.screenX, bPoint.screenY);
            ctx.stroke();
          });
        });
      });
    };

    const drawConnections = () => {
      connections.forEach((connection) => {
        const from = points[connection.from];
        const to = points[connection.to];
        if (!from || !to || (!from.visible && !to.visible)) return;
        const midX = (from.screenX + to.screenX) / 2;
        const midY = (from.screenY + to.screenY) / 2;
        const dx = to.screenX - from.screenX;
        const dy = to.screenY - from.screenY;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const controlX = midX + (dy / distance) * distance * 0.15;
        const controlY = midY - (dx / distance) * distance * 0.15;
        const t = connection.progress;
        const x = (1 - t) * (1 - t) * from.screenX + 2 * (1 - t) * t * controlX + t * t * to.screenX;
        const y = (1 - t) * (1 - t) * from.screenY + 2 * (1 - t) * t * controlY + t * t * to.screenY;
        const fade = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1;
        const weight = connection.weight;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10 + weight * 14);
        glow.addColorStop(0, `rgba(255, ${Math.round(230 - weight * 30)}, ${Math.round(180 - weight * 73)}, ${0.6 * fade})`);
        glow.addColorStop(0.4, `rgba(245, 200, 107, ${0.28 * fade})`);
        glow.addColorStop(1, 'rgba(245, 200, 107, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 10 + weight * 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 240, 200, ${0.7 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.8 + weight * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawTrainingTicks = () => {
      trainingTicks.forEach((tick) => {
        const point = points[tick.pointIndex];
        if (!point?.visible) return;
        const t = tick.age / tick.maxAge;
        ctx.strokeStyle = `rgba(245, 200, 107, ${(1 - t) * 0.7})`;
        ctx.lineWidth = 2 * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, 4 + t * 32, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const drawRipples = () => {
      ripples.forEach((ripple) => {
        const t = ripple.age / ripple.maxAge;
        ctx.strokeStyle = `rgba(245, 200, 107, ${(1 - t) * 0.35 * ripple.intensity})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, 2 + t * 14 * ripple.intensity, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const drawCityPoints = () => {
      const swarmLookup = new Map();
      swarms.forEach((swarm) => swarm.members.forEach((member) => swarmLookup.set(member, swarm)));
      points.forEach((point, index) => {
        if (!point.visible) return;
        const pulse = Math.sin(point.pulsePhase) * 0.3 + 0.7;
        const opacity = point.opacity || 1;
        const swarm = swarmLookup.get(index);
        const color = swarm?.hue || (point.permanent ? { r: 245, g: 200, b: 107 } : { r: 100, g: 200, b: 255 });
        const glowSize = point.permanent ? 12 : 10;
        const glow = ctx.createRadialGradient(point.screenX, point.screenY, 0, point.screenX, point.screenY, glowSize);
        glow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.38 * pulse * opacity})`);
        glow.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.18 * pulse * opacity})`);
        glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(0.55 + pulse * 0.15) * opacity})`;
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, point.permanent ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      ctx.fillStyle = '#060505';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      drawStars();
      updatePoints();
      updateTemporaryNodes();
      updateConnections();
      updateTrainingTicks();
      updateRipples();
      updateSwarms();
      drawEarth();
      drawSwarmHalos();
      drawConnections();
      drawTrainingTicks();
      drawRipples();
      drawCityPoints();
      animationId = requestAnimationFrame(animate);
    };

    earthImage = new Image();
    earthImage.onload = () => {
      imageLoaded = true;
      renderEarthToCache();
    };
    earthImage.src = earthTexture;

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'var(--bg-base)' }}
    />
  );
}
