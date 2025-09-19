"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const intVal = parseInt(normalized, 16);
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
}

const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasEl = canvas as HTMLCanvasElement;
    const containerEl = container as HTMLDivElement;
    const ctxEl = ctx as CanvasRenderingContext2D;

    const rgb = hexToRgb(color);
    const circles: {
      x: number;
      y: number;
      tx: number;
      ty: number;
      r: number;
      a: number;
      ta: number;
      dx: number;
      dy: number;
      m: number;
    }[] = [];

    function resize() {
      canvasEl.width = Math.floor(containerEl.clientWidth * dpr);
      canvasEl.height = Math.floor(containerEl.clientHeight * dpr);
      canvasEl.style.width = `${containerEl.clientWidth}px`;
      canvasEl.style.height = `${containerEl.clientHeight}px`;
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
      circles.length = 0;
      for (let i = 0; i < quantity; i++) {
        circles.push({
          x: Math.random() * canvasEl.width,
          y: Math.random() * canvasEl.height,
          tx: 0,
          ty: 0,
          r: Math.floor(Math.random() * 2) + size,
          a: 0,
          ta: Math.random() * 0.6 + 0.1,
          dx: (Math.random() - 0.5) * 0.1,
          dy: (Math.random() - 0.5) * 0.1,
          m: 0.1 + Math.random() * 4,
        });
      }
    }

    function clear() {
      ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    let mouseX = 0;
    let mouseY = 0;
    function onMouseMove(e: MouseEvent) {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - canvasEl.width / (2 * dpr);
      const y = e.clientY - rect.top - canvasEl.height / (2 * dpr);
      const inside =
        Math.abs(x) < canvasEl.width / (2 * dpr) &&
        Math.abs(y) < canvasEl.height / (2 * dpr);
      if (inside) {
        mouseX = x;
        mouseY = y;
      }
    }

    function animate() {
      clear();
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        const edges = [
          c.x - c.r,
          canvasEl.width / dpr - c.x - c.r,
          c.y - c.r,
          canvasEl.height / dpr - c.y - c.r,
        ];
        const closest = Math.min(...edges);
        const remap = Math.max(
          0,
          Math.min(1, ((closest - 0) * (1 - 0)) / (20 - 0) + 0)
        );
        c.a = remap > 1 ? Math.min(c.a + 0.02, c.ta) : c.ta * remap;
        c.x += c.dx + vx;
        c.y += c.dy + vy;
        c.tx += (mouseX / (staticity / c.m) - c.tx) / ease;
        c.ty += (mouseY / (staticity / c.m) - c.ty) / ease;

        ctxEl.save();
        ctxEl.translate(c.tx, c.ty);
        ctxEl.beginPath();
        ctxEl.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctxEl.fillStyle = `rgba(${rgb.join(", ")}, ${c.a})`;
        ctxEl.fill();
        ctxEl.restore();

        if (
          c.x < -c.r ||
          c.x > (canvasEl?.width ?? 0) / dpr + c.r ||
          c.y < -c.r ||
          c.y > (canvasEl?.height ?? 0) / dpr + c.r
        ) {
          circles[i] = {
            x: Math.random() * (canvasEl?.width ?? 0),
            y: Math.random() * (canvasEl?.height ?? 0),
            tx: 0,
            ty: 0,
            r: Math.floor(Math.random() * 2) + size,
            a: 0,
            ta: Math.random() * 0.6 + 0.1,
            dx: (Math.random() - 0.5) * 0.1,
            dy: (Math.random() - 0.5) * 0.1,
            m: 0.1 + Math.random() * 4,
          };
        }
      }
      requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [color, ease, quantity, refresh, size, staticity, vx, vy, dpr]);

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={containerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

export { Particles };
