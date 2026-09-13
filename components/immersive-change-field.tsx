"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Orbit } from "lucide-react";

type FieldChange = {
  id: string;
  title: string;
  category: string;
  rate?: number;
};

type Point = { x: number; y: number; z: number; size: number; seed: number; tint: number };

function seeded(index: number) {
  const value = Math.sin(index * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

export function ImmersiveChangeField({ changes }: { changes: FieldChange[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const points: Point[] = Array.from({ length: 260 }, (_, index) => {
      const theta = seeded(index + 1) * Math.PI * 2;
      const phi = Math.acos(seeded(index + 11) * 2 - 1);
      const radius = 0.55 + Math.pow(seeded(index + 31), 0.65) * 1.55;
      return {
        x: Math.sin(phi) * Math.cos(theta) * radius,
        y: Math.cos(phi) * radius,
        z: Math.sin(phi) * Math.sin(theta) * radius,
        size: 0.45 + seeded(index + 61) * 1.55,
        seed: seeded(index + 91) * Math.PI * 2,
        tint: seeded(index + 121)
      };
    });
    let width = 0;
    let height = 0;
    let dpr = 1;
    let start = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (now: number) => {
      const elapsed = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#171512";
      context.fillRect(0, 0, width, height);

      const pointerX = pointerRef.current.x;
      const pointerY = pointerRef.current.y;
      const centerX = width * 0.5 + pointerX * 20;
      const centerY = height * 0.5 + pointerY * 15;
      const scale = Math.min(width, height) * 0.22;
      const rotationY = (reducedMotion ? 0.32 : elapsed * 0.24) + pointerX * 0.3;
      const rotationX = pointerY * 0.22 + Math.sin(elapsed * 0.22) * 0.06;
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const camera = 4.7;

      const ambient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 3.1);
      ambient.addColorStop(0, "rgba(195, 39, 43, 0.12)");
      ambient.addColorStop(0.32, "rgba(47, 93, 98, 0.08)");
      ambient.addColorStop(1, "rgba(23, 21, 18, 0)");
      context.fillStyle = ambient;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(201, 169, 110, 0.12)";
      context.lineWidth = 1;
      for (let ring = 1; ring < 5; ring += 1) {
        context.beginPath();
        context.ellipse(centerX, centerY, scale * ring * 0.88, scale * ring * 0.28, rotationY * 0.4, 0, Math.PI * 2);
        context.stroke();
      }

      const projected = points.map((point) => {
        const wobble = reducedMotion ? 0 : Math.sin(elapsed * 0.7 + point.seed) * 0.035;
        let x = point.x + pointerX * (0.08 + point.z * 0.015) + wobble;
        let y = point.y + pointerY * (0.06 + point.x * 0.01);
        let z = point.z + Math.cos(elapsed * 0.5 + point.seed) * (reducedMotion ? 0 : 0.025);
        const rotatedX = x * cosY - z * sinY;
        z = x * sinY + z * cosY;
        const rotatedY = y * cosX - z * sinX;
        z = y * sinX + z * cosX;
        const perspective = camera / (camera - z);
        return {
          x: centerX + rotatedX * scale * perspective,
          y: centerY + rotatedY * scale * perspective,
          depth: (z + 2) / 4,
          size: point.size * (0.52 + perspective * 0.66),
          tint: point.tint
        };
      }).sort((a, b) => a.depth - b.depth);

      for (let index = 0; index < projected.length; index += 1) {
        const point = projected[index];
        for (let link = index + 1; link < Math.min(index + 5, projected.length); link += 1) {
          const near = projected[link];
          const distance = Math.hypot(near.x - point.x, near.y - point.y);
          if (distance > Math.min(width, height) * 0.12) continue;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(near.x, near.y);
          context.strokeStyle = `rgba(47, 93, 98, ${Math.max(0.025, 0.11 - distance / Math.min(width, height) * 0.05)})`;
          context.stroke();
        }
      }

      projected.forEach((point) => {
        const alpha = 0.16 + point.depth * 0.84;
        const glow = point.size * (3.5 + point.depth * 4);
        context.beginPath();
        context.arc(point.x, point.y, glow, 0, Math.PI * 2);
        context.fillStyle = point.tint > 0.9 ? "rgba(195, 39, 43, 0.12)" : "rgba(201, 169, 110, 0.08)";
        context.globalAlpha = alpha;
        context.fill();
        context.beginPath();
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        context.fillStyle = point.tint > 0.9 ? "#c3272b" : point.tint > 0.64 ? "#c9a96e" : "#6fa0a0";
        context.globalAlpha = alpha;
        context.fill();
        context.globalAlpha = 1;
      });

      const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 0.42);
      core.addColorStop(0, "rgba(237, 230, 214, 0.9)");
      core.addColorStop(0.08, "rgba(201, 169, 110, 0.8)");
      core.addColorStop(0.28, "rgba(195, 39, 43, 0.18)");
      core.addColorStop(1, "rgba(195, 39, 43, 0)");
      context.fillStyle = core;
      context.fillRect(centerX - scale * 0.42, centerY - scale * 0.42, scale * 0.84, scale * 0.84);

      if (!reducedMotion) frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  return (
    <div
      className="immersive-field relative min-h-[420px] overflow-hidden border border-[#3a352e] bg-[#171512] lg:min-h-[570px]"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: (event.clientX - bounds.left) / bounds.width * 2 - 1, y: (event.clientY - bounds.top) / bounds.height * 2 - 1 };
      }}
      onPointerLeave={() => { pointerRef.current = { x: 0, y: 0 }; }}
    >
      <canvas ref={canvasRef} role="img" aria-label="由变化节点组成的沉浸式探索场" className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,transparent_0%,rgba(23,21,18,0.12)_42%,rgba(23,21,18,0.76)_100%)]" />
      <div className="absolute left-5 top-5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#c9a96e] sm:left-8 sm:top-8">
        <Orbit size={15} aria-hidden="true" />
        变化场 / 73
      </div>
      <div className="absolute bottom-5 left-5 max-w-[220px] text-[#ede6d6] sm:bottom-8 sm:left-8">
        <p className="font-serif text-xl font-semibold sm:text-2xl">把灵感放进轨道</p>
        <p className="mt-2 text-xs leading-5 text-[#c4baaa]">拖动视线，找到下一变。每个节点都通向一份可验证的配方。</p>
      </div>
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:right-8">
        {changes.slice(0, 3).map((change, index) => (
          <Link
            key={change.id}
            href={`/changes/${change.id}`}
            className="group flex max-w-[190px] items-center gap-3 border border-[#c9a96e]/40 bg-[#1e1b16]/80 px-3 py-2 text-[#ede6d6] backdrop-blur-sm transition duration-200 ease-out hover:-translate-x-1 hover:border-[#c3272b] focus-visible:outline-2 focus-visible:outline-[#c3272b] sm:max-w-[230px] sm:px-4 sm:py-3"
            style={{ borderRadius: 4, marginTop: `${(index - 1) * 18}px` }}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center border border-[#c9a96e] font-mono text-xs text-[#c9a96e]" style={{ borderRadius: 999 }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">{change.title}</span>
              <span className="mt-1 block text-[10px] text-[#c4baaa]">{change.category}{change.rate ? ` · ${change.rate}% 成变率` : ""}</span>
            </span>
            <ArrowUpRight size={14} className="shrink-0 text-[#c9a96e] transition group-hover:text-[#c3272b]" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
