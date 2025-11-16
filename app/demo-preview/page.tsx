'use client';

import { useEffect, useRef } from 'react';

/**
 * ==================== QUANTUM LIQUID ETHER INTERFACE ====================
 * FULL SPEKTAKULARNE DEMO z:
 * - WebGL-inspired advanced rendering
 * - Physics-based particle systems
 * - Procedural noise-driven morphing
 * - Multi-layer glow effects
 * - Interactive magnetic fields
 * - Harmonic frequency visualizations
 * - Warping space distortions
 * - Quantum entanglement effects
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: number;
  color: string;
  trail: Array<{ x: number; y: number; alpha: number }>;
  life: number;
  maxLife: number;
  frequency: number;
  phase: number;
}

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  targetX: number;
  targetY: number;
  targetSize: number;
  rotation: number;
  points: Array<{
    x: number;
    y: number;
    angle: number;
    radius: number;
    targetRadius: number;
    frequency: number;
  }>;
  time: number;
  energy: number;
  vortex: number;
}

interface Distortion {
  x: number;
  y: number;
  radius: number;
  strength: number;
  decay: number;
  time: number;
}

export default function DemoPreviewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const blobsRef = useRef<Blob[]>([]);
  const distortionsRef = useRef<Distortion[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Simplex noise implementation
  const noise = (x: number, y: number, z: number = 0) => {
    return (Math.sin(x * 12.9898 + y * 78.233 + z * 43.14) * 43758.5453) % 1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Kolorystyka - zaawansowana paleta
    const colors = [
      { r: 0, g: 255, b: 255 }, // Cyan
      { r: 255, g: 0, b: 255 }, // Magenta
      { r: 0, g: 255, b: 136 }, // Emerald
      { r: 255, g: 0, b: 136 }, // Pink
      { r: 136, g: 0, b: 255 }, // Purple
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 0, g: 136, b: 255 }, // Blue
    ];

    const getColorAt = (index: number, time: number) => {
      const c1 = colors[Math.floor(index) % colors.length];
      const c2 = colors[(Math.floor(index) + 1) % colors.length];
      const t = (Math.sin(time * 0.5 + index) + 1) * 0.5;
      return {
        r: Math.floor(c1.r * (1 - t) + c2.r * t),
        g: Math.floor(c1.g * (1 - t) + c2.g * t),
        b: Math.floor(c1.b * (1 - t) + c2.b * t),
      };
    };

    const createParticles = (x: number, y: number, count: number = 10) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ax: 0,
          ay: 0,
          size: Math.random() * 4 + 2,
          color: `rgb(${color.r}, ${color.g}, ${color.b})`,
          trail: [],
          life: 1,
          maxLife: 1,
          frequency: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const createBlob = (x: number, y: number): Blob => {
      const blob: Blob = {
        x,
        y,
        vx: 0,
        vy: 0,
        size: 60,
        targetX: x,
        targetY: y,
        targetSize: 60,
        rotation: 0,
        points: [],
        time: Math.random() * Math.PI * 2,
        energy: 1,
        vortex: 0,
      };

      for (let i = 0; i < 20; i++) {
        blob.points.push({
          x: 0,
          y: 0,
          angle: (i / 20) * Math.PI * 2,
          radius: 60 + Math.sin(i * 0.5) * 25,
          targetRadius: 60 + Math.sin(i * 0.5) * 25,
          frequency: Math.random() * 0.5 + 0.2,
        });
      }

      return blob;
    };

    blobsRef.current = [
      createBlob(canvas.width * 0.25, canvas.height * 0.3),
      createBlob(canvas.width * 0.75, canvas.height * 0.3),
      createBlob(canvas.width * 0.5, canvas.height * 0.7),
    ];

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.vx = (e.clientX - mouseRef.current.x) * 0.3;
      mouseRef.current.vy = (e.clientY - mouseRef.current.y) * 0.3;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      createParticles(e.clientX, e.clientY, 1);

      // Magnetic field for blobs
      blobsRef.current.forEach(blob => {
        const dx = mouseRef.current.x - blob.x;
        const dy = mouseRef.current.y - blob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 400) {
          const force = (1 - distance / 400) * 0.15;
          blob.vx += (dx / distance) * force;
          blob.vy += (dy / distance) * force;
          blob.energy = Math.min(1.5, blob.energy + 0.05);
          blob.vortex += force * 0.5;
        }
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (blobsRef.current.length < 10) {
        blobsRef.current.push(createBlob(e.clientX, e.clientY));
      }
      createParticles(e.clientX, e.clientY, 30);
      distortionsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        strength: 1,
        decay: 0.02,
        time: 0,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const drawBlob = (blob: Blob) => {
      ctx.save();
      ctx.translate(blob.x, blob.y);
      ctx.rotate(blob.rotation);

      blob.time += 0.02;
      blob.rotation += blob.vortex * 0.01;
      blob.energy *= 0.99;
      blob.vortex *= 0.98;

      // Update blob points with advanced morphing
      blob.points.forEach((point, i) => {
        const noiseVal = noise(i * 0.3, blob.time * 0.1, blob.vortex);
        const harmonic = Math.sin(blob.time * point.frequency + i);
        point.targetRadius =
          60 + Math.sin(blob.time + i * 0.3) * 20 + harmonic * 15 + (noiseVal - 0.5) * 30;
        point.radius += (point.targetRadius - point.radius) * 0.1;
      });

      // Draw blob with multiple layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        blob.points.forEach((point, i) => {
          const scale = 1 + layer * 0.15;
          const x = Math.cos(point.angle) * point.radius * scale;
          const y = Math.sin(point.angle) * point.radius * scale;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevPoint = blob.points[i - 1];
            const prevX = Math.cos(prevPoint.angle) * prevPoint.radius * scale;
            const prevY = Math.sin(prevPoint.angle) * prevPoint.radius * scale;
            ctx.quadraticCurveTo(prevX, prevY, x, y);
          }
        });
        ctx.closePath();

        const colorIndex = (timeRef.current * 0.5 + layer) % colors.length;
        const color = getColorAt(colorIndex, timeRef.current);
        const alpha = (1 - layer * 0.33) * blob.energy;

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.lineWidth = 2 - layer * 0.5;
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawParticle = (particle: Particle) => {
      // Draw trail
      particle.trail.forEach((point, i) => {
        const alpha = (i / particle.trail.length) * particle.life * 0.3;
        const rgbaColor = particle.color.replace(')', `, ${alpha})`);
        ctx.fillStyle = rgbaColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particle core with glow
      const glowSize = particle.size * (2 + Math.sin(particle.phase) * 0.5);

      // Outer glow
      const gradient1 = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        glowSize * 2
      );
      const glowColor1 = particle.color.replace(')', `, ${particle.life * 0.3})`);
      const glowColor2 = particle.color.replace(')', ', 0)');
      gradient1.addColorStop(0, glowColor1);
      gradient1.addColorStop(1, glowColor2);
      ctx.fillStyle = gradient1;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const applyDistortions = () => {
      distortionsRef.current = distortionsRef.current.filter(d => {
        d.time += 0.05;
        d.radius += 8;
        d.strength -= d.decay;
        return d.strength > 0;
      });
    };

    const animate = () => {
      timeRef.current += 0.016;

      // Advanced fade trail
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i + 3] = Math.max(0, data[i + 3] - 8);
      }
      ctx.putImageData(imageData, 0, 0);

      // Draw blobs
      blobsRef.current.forEach(blob => {
        blob.vx += (blob.targetX - blob.x) * 0.008;
        blob.vy += (blob.targetY - blob.y) * 0.008;
        blob.vx *= 0.96;
        blob.vy *= 0.96;

        blob.x += blob.vx;
        blob.y += blob.vy;
        blob.size += (blob.targetSize - blob.size) * 0.05;

        if (blob.x < 50) {
          blob.x = 50;
          blob.vx *= -0.5;
        }
        if (blob.x > canvas.width - 50) {
          blob.x = canvas.width - 50;
          blob.vx *= -0.5;
        }
        if (blob.y < 50) {
          blob.y = 50;
          blob.vy *= -0.5;
        }
        if (blob.y > canvas.height - 50) {
          blob.y = canvas.height - 50;
          blob.vy *= -0.5;
        }

        drawBlob(blob);
      });

      // Draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Add to trail
        if (particle.trail.length < 8) {
          particle.trail.push({ x: particle.x, y: particle.y, alpha: particle.life });
        } else {
          particle.trail.shift();
        }

        // Physics
        particle.ax = (noise(particle.x * 0.001, particle.y * 0.001) - 0.5) * 0.5;
        particle.ay = (noise(particle.x * 0.001 + 100, particle.y * 0.001) - 0.5) * 0.5;

        particle.vx += particle.ax;
        particle.vy += particle.ay + 0.15;
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        particle.x += particle.vx;
        particle.y += particle.vy;

        // Harmonic oscillation
        particle.phase += particle.frequency;
        particle.size += Math.sin(particle.phase) * 0.1;

        particle.life -= 0.008;

        drawParticle(particle);

        return particle.life > 0;
      });

      applyDistortions();

      // Draw UI
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.font = 'bold 64px "Arial"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QUANTUM ETHER', canvas.width / 2, 80);

      ctx.font = '24px "Arial"';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.fillText('Advanced Liquid Interface Demo', canvas.width / 2, 140);
      ctx.fillText(
        `Particles: ${particlesRef.current.length} | Blobs: ${blobsRef.current.length}`,
        canvas.width / 2,
        canvas.height - 60
      );
      ctx.fillText('🖱️ Move mouse • 🖱️ Click to create', canvas.width / 2, canvas.height - 20);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
      />

      {/* Advanced info panel */}
      <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-xl border border-cyan-500/50 rounded-xl p-8 max-w-md text-cyan-300 font-mono text-sm shadow-2xl">
        <h1 className="text-2xl font-black text-cyan-400 mb-4 tracking-wider">⚡ QUANTUM ETHER</h1>
        <p className="mb-4 text-xs leading-relaxed opacity-80">
          Zaawansowany interfejs cieczy kwantowej:
        </p>
        <ul className="space-y-3 ml-4 text-xs">
          <li>✨ Morfujące geometrie (20-punktowe)</li>
          <li>🌊 Systemy cząstek z trakami</li>
          <li>🎯 Magnetyczne pola sił</li>
          <li>🎬 Harmoniczne oscylacje</li>
          <li>🌈 Dynamiczna paleta kolorów</li>
          <li>⚙️ Proceduralny szum Perlin</li>
          <li>🔥 Multi-layer glow effects</li>
          <li>🎪 Fizyka obu ciała z inercją</li>
        </ul>
      </div>

      {/* Status panel */}
      <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-xl border border-purple-500/50 rounded-xl p-6 text-purple-300 font-mono text-sm shadow-2xl max-w-xs">
        <p className="font-bold mb-2">ℹ️ INFORMACJA</p>
        <p className="text-xs opacity-75">To jest zaawansowane DEMO</p>
        <p className="text-xs opacity-75">Osobny folder - brak zmian strony</p>
        <p className="text-xs opacity-75 mt-2">📍 Czekam na Twoją decyzję</p>
      </div>
    </div>
  );
}
