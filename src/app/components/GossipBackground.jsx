import { useEffect, useRef } from "react";
import earthTexture from "../../imports/earth_noClouds.0330.jpg";
function GossipBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId;
    const rotation = 0;
    const earthRadius = 280;
    let earthImage = null;
    let imageLoaded = false;
    const permanentCities = [
      // North America (inland)
      { lat: 39.7392, lon: -104.9903, city: "Denver" },
      { lat: 41.8781, lon: -87.6298, city: "Chicago" },
      { lat: 19.4326, lon: -99.1332, city: "Mexico City" },
      // South America (inland)
      { lat: -15.7939, lon: -47.8828, city: "Bras\xEDlia" },
      { lat: -31.4201, lon: -64.1888, city: "C\xF3rdoba" },
      // Europe (inland)
      { lat: 52.52, lon: 13.405, city: "Berlin" },
      { lat: 48.8566, lon: 2.3522, city: "Paris" },
      { lat: 40.4168, lon: -3.7038, city: "Madrid" },
      // Asia (inland)
      { lat: 55.7558, lon: 37.6173, city: "Moscow" },
      { lat: 39.9042, lon: 116.4074, city: "Beijing" },
      { lat: 28.6139, lon: 77.209, city: "New Delhi" },
      { lat: 13.7563, lon: 100.5018, city: "Bangkok" },
      // Africa (inland)
      { lat: 30.0444, lon: 31.2357, city: "Cairo" },
      { lat: -4.4419, lon: 15.2663, city: "Kinshasa" },
      // Australia (inland)
      { lat: -23.698, lon: 133.8807, city: "Alice Springs" }
    ];
    const tempNodeLocations = [
      // North America
      { lat: 32.7767, lon: -96.797, city: "Dallas" },
      { lat: 49.8951, lon: -97.1384, city: "Winnipeg" },
      { lat: 45.5017, lon: -73.5673, city: "Montr\xE9al" },
      // South America
      { lat: 4.711, lon: -74.0721, city: "Bogot\xE1" },
      { lat: -16.5, lon: -68.15, city: "La Paz" },
      // Europe
      { lat: 52.2297, lon: 21.0122, city: "Warsaw" },
      { lat: 48.1351, lon: 11.582, city: "Munich" },
      { lat: 47.4979, lon: 19.0402, city: "Budapest" },
      // Asia
      { lat: 43.2389, lon: 76.945, city: "Almaty" },
      { lat: 31.5204, lon: 74.3587, city: "Lahore" },
      { lat: 29.563, lon: 106.5516, city: "Chongqing" },
      { lat: 47.918, lon: 106.917, city: "Ulaanbaatar" },
      // Africa
      { lat: 15.5007, lon: 32.5599, city: "Khartoum" },
      { lat: -1.2921, lon: 36.8219, city: "Nairobi" },
      { lat: -26.2041, lon: 28.0473, city: "Johannesburg" },
      // Australia
      { lat: -35.2809, lon: 149.13, city: "Canberra" },
      { lat: -25.3444, lon: 131.0369, city: "Uluru" }
    ];
    let points = [];
    let connections = [];
    let centerX = 0;
    let centerY = 0;
    let sphereVertices = [];
    const loadTexture = () => {
      earthImage = new Image();
      earthImage.onload = () => {
        imageLoaded = true;
      };
      earthImage.src = earthTexture;
    };
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
      initPoints();
      createSphere();
    };
    const latLonToXYZ = (lat, lon, radius) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return {
        x: -radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
      };
    };
    const createSphere = () => {
      sphereVertices = [];
      const latSegments = 40;
      const lonSegments = 60;
      for (let lat = 0; lat <= latSegments; lat++) {
        const theta = lat * Math.PI / latSegments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= lonSegments; lon++) {
          const phi = lon * 2 * Math.PI / lonSegments;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          const x = cosPhi * sinTheta;
          const y = cosTheta;
          const z = sinPhi * sinTheta;
          sphereVertices.push({
            x: x * earthRadius,
            y: y * earthRadius,
            z: z * earthRadius,
            u: lon / lonSegments,
            v: lat / latSegments,
            screenX: 0,
            screenY: 0,
            visible: false
          });
        }
      }
    };
    const rotateSphere = () => {
      const cosRot = Math.cos(rotation);
      const sinRot = Math.sin(rotation);
      sphereVertices.forEach((vertex) => {
        const x = vertex.x * cosRot - vertex.z * sinRot;
        const z = vertex.z * cosRot + vertex.x * sinRot;
        vertex.screenX = centerX + x;
        vertex.screenY = centerY - vertex.y;
        vertex.visible = z > 0;
      });
    };
    const initPoints = () => {
      points = permanentCities.map((city) => {
        const { x, y, z } = latLonToXYZ(city.lat, city.lon, earthRadius);
        return {
          lat: city.lat,
          lon: city.lon,
          x,
          y,
          z,
          screenX: 0,
          screenY: 0,
          visible: false,
          pulsePhase: Math.random() * Math.PI * 2,
          city: city.city,
          permanent: true,
          opacity: 1
        };
      });
      for (let i = 0; i < 4; i++) {
        const from = Math.floor(Math.random() * points.length);
        let to = Math.floor(Math.random() * points.length);
        while (to === from) {
          to = Math.floor(Math.random() * points.length);
        }
        connections.push({
          from,
          to,
          progress: Math.random(),
          speed: 12e-4 + Math.random() * 15e-4,
          active: true
        });
      }
    };
    const spawnTemporaryNode = () => {
      const location = tempNodeLocations[Math.floor(Math.random() * tempNodeLocations.length)];
      const { x, y, z } = latLonToXYZ(location.lat, location.lon, earthRadius);
      const tempNode = {
        lat: location.lat,
        lon: location.lon,
        x,
        y,
        z,
        screenX: 0,
        screenY: 0,
        visible: false,
        pulsePhase: Math.random() * Math.PI * 2,
        city: location.city,
        permanent: false,
        opacity: 0,
        lifetime: 0,
        maxLifetime: 180 + Math.random() * 120
        // 3-5 seconds at 60fps
      };
      points.push(tempNode);
    };
    const updateTemporaryNodes = () => {
      points = points.filter((point) => {
        if (point.permanent) return true;
        if (point.lifetime !== void 0 && point.maxLifetime !== void 0) {
          point.lifetime++;
          if (point.lifetime < point.maxLifetime * 0.2) {
            point.opacity = point.lifetime / (point.maxLifetime * 0.2);
          } else if (point.lifetime > point.maxLifetime * 0.8) {
            const fadeProgress = (point.lifetime - point.maxLifetime * 0.8) / (point.maxLifetime * 0.2);
            point.opacity = 1 - fadeProgress;
          } else {
            point.opacity = 1;
          }
          return point.lifetime < point.maxLifetime;
        }
        return true;
      });
      if (Math.random() < 8e-3 && points.filter((p) => !p.permanent).length < 6) {
        spawnTemporaryNode();
      }
    };
    const projectPoint = (point) => {
      const cosRot = Math.cos(rotation);
      const sinRot = Math.sin(rotation);
      const x = point.x * cosRot - point.z * sinRot;
      const z = point.z * cosRot + point.x * sinRot;
      point.screenX = centerX + x;
      point.screenY = centerY - point.y;
      point.visible = z > -earthRadius * 0.3;
    };
    const updateRotation = () => {
      points.forEach((point) => {
        projectPoint(point);
        point.pulsePhase += 0.02;
      });
    };
    const updateConnections = () => {
      connections = connections.filter((conn) => {
        return conn.from < points.length && conn.to < points.length && points[conn.from] && points[conn.to];
      });
      connections.forEach((conn) => {
        if (conn.active) {
          conn.progress += conn.speed;
          if (conn.progress >= 1) {
            conn.progress = 0;
            if (Math.random() < 0.3) {
              let newTo = Math.floor(Math.random() * points.length);
              while (newTo === conn.from && points.length > 1) {
                newTo = Math.floor(Math.random() * points.length);
              }
              conn.to = newTo;
            }
          }
        }
      });
      if (Math.random() < 5e-3 && connections.length < 6 && points.length > 1) {
        const from = Math.floor(Math.random() * points.length);
        let to = Math.floor(Math.random() * points.length);
        while (to === from && points.length > 1) {
          to = Math.floor(Math.random() * points.length);
        }
        connections.push({
          from,
          to,
          progress: 0,
          speed: 12e-4 + Math.random() * 15e-4,
          active: true
        });
      }
      if (connections.length > 6) {
        connections = connections.slice(0, 6);
      }
    };
    const drawStars = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 200; i++) {
        const x = i * 7919 % canvas.width;
        const y = i * 4159 % canvas.height;
        const size = i * 37 % 10 / 10;
        ctx.fillRect(x, y, size, size);
      }
    };
    const drawEarth = () => {
      if (!imageLoaded || !earthImage) {
        const gradient = ctx.createRadialGradient(
          centerX - earthRadius * 0.3,
          centerY - earthRadius * 0.3,
          earthRadius * 0.3,
          centerX,
          centerY,
          earthRadius
        );
        gradient.addColorStop(0, "#0a1628");
        gradient.addColorStop(0.5, "#050d1a");
        gradient.addColorStop(1, "#020408");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const latSegments = 40;
        const lonSegments = 60;
        for (let lat = 0; lat < latSegments; lat++) {
          for (let lon = 0; lon < lonSegments; lon++) {
            const idx1 = lat * (lonSegments + 1) + lon;
            const idx2 = idx1 + lonSegments + 1;
            const idx3 = idx1 + 1;
            const idx4 = idx2 + 1;
            const v1 = sphereVertices[idx1];
            const v2 = sphereVertices[idx2];
            const v3 = sphereVertices[idx3];
            const v4 = sphereVertices[idx4];
            if (!v1 || !v2 || !v3 || !v4) continue;
            if (v1.visible || v2.visible || v3.visible || v4.visible) {
              const avgZ = (v1.z + v2.z + v3.z + v4.z) / 4;
              if (avgZ > -earthRadius * 0.5) {
                const sx = v1.u * earthImage.width;
                const sy = v1.v * earthImage.height;
                const sw = (v4.u - v1.u) * earthImage.width;
                const sh = (v2.v - v1.v) * earthImage.height;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(v1.screenX, v1.screenY);
                ctx.lineTo(v3.screenX, v3.screenY);
                ctx.lineTo(v4.screenX, v4.screenY);
                ctx.lineTo(v2.screenX, v2.screenY);
                ctx.closePath();
                ctx.clip();
                const dx1 = v3.screenX - v1.screenX;
                const dy1 = v3.screenY - v1.screenY;
                const dx2 = v2.screenX - v1.screenX;
                const dy2 = v2.screenY - v1.screenY;
                ctx.transform(
                  dx1 / sw,
                  dy1 / sw,
                  dx2 / sh,
                  dy2 / sh,
                  v1.screenX,
                  v1.screenY
                );
                try {
                  ctx.drawImage(earthImage, sx, sy, sw || 1, sh || 1, 0, 0, sw || 1, sh || 1);
                } catch {
                  // Ignore texture sampling errors at sphere seams.
                }
                ctx.restore();
              }
            }
          }
        }
        const shadowGradient = ctx.createRadialGradient(
          centerX + earthRadius * 0.3,
          centerY,
          earthRadius * 0.3,
          centerX,
          centerY,
          earthRadius
        );
        shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        shadowGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
        shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      const atmosphereGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        earthRadius,
        centerX,
        centerY,
        earthRadius + 25
      );
      atmosphereGradient.addColorStop(0, "rgba(100, 150, 200, 0.2)");
      atmosphereGradient.addColorStop(0.5, "rgba(60, 100, 150, 0.1)");
      atmosphereGradient.addColorStop(1, "rgba(30, 50, 80, 0)");
      ctx.fillStyle = atmosphereGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius + 25, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawCityPoints = () => {
      points.forEach((point) => {
        if (!point.visible) return;
        const pulse = Math.sin(point.pulsePhase) * 0.3 + 0.7;
        const opacity = point.opacity || 1;
        const glowSize = point.permanent ? 12 : 10;
        const coreSize = point.permanent ? 2.5 : 2;
        const color = point.permanent ? { r: 245, g: 200, b: 107 } : { r: 100, g: 200, b: 255 };
        const glowGradient = ctx.createRadialGradient(
          point.screenX,
          point.screenY,
          0,
          point.screenX,
          point.screenY,
          glowSize
        );
        glowGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * pulse * opacity})`);
        glowGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 * pulse * opacity})`);
        glowGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(0.8 + pulse * 0.2) * opacity})`;
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, coreSize, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    const drawConnections = () => {
      connections.forEach((conn) => {
        const from = points[conn.from];
        const to = points[conn.to];
        if (!from || !to) return;
        if (!from.visible && !to.visible) return;
        const midX = (from.screenX + to.screenX) / 2;
        const midY = (from.screenY + to.screenY) / 2;
        const dx = to.screenX - from.screenX;
        const dy = to.screenY - from.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const arc = dist * 0.15;
        const controlX = midX + dy / dist * arc;
        const controlY = midY - dx / dist * arc;
        if (conn.active) {
          const t = conn.progress;
          const x = (1 - t) * (1 - t) * from.screenX + 2 * (1 - t) * t * controlX + t * t * to.screenX;
          const y = (1 - t) * (1 - t) * from.screenY + 2 * (1 - t) * t * controlY + t * t * to.screenY;
          const fadeOpacity = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1;
          const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, 15);
          particleGlow.addColorStop(0, `rgba(245, 200, 107, ${0.9 * fadeOpacity})`);
          particleGlow.addColorStop(0.4, `rgba(245, 200, 107, ${0.5 * fadeOpacity})`);
          particleGlow.addColorStop(1, "rgba(245, 200, 107, 0)");
          ctx.fillStyle = particleGlow;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 230, 150, ${fadeOpacity})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };
    const animate = () => {
      ctx.fillStyle = "#060505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawStars();
      rotateSphere();
      updateRotation();
      updateTemporaryNodes();
      updateConnections();
      drawEarth();
      drawConnections();
      drawCityPoints();
      animationId = requestAnimationFrame(animate);
    };
    loadTexture();
    window.addEventListener("resize", resize);
    resize();
    animate();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  return <canvas
    ref={canvasRef}
    className="absolute inset-0 w-full h-full"
    style={{ background: "var(--bg-base)" }}
  />;
}
export {
  GossipBackground
};
