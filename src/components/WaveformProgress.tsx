import React, { useEffect, useRef, useState, useMemo } from "react";

interface WaveformProgressProps {
  trackId: string | null;
  progress: number; // in seconds
  duration: number; // in seconds
  onSeek: (time: number) => void;
  analyser?: AnalyserNode | null;
  isPlaying?: boolean;
}

export const WaveformProgress: React.FC<WaveformProgressProps> = ({
  trackId,
  progress,
  duration,
  onSeek,
  analyser,
  isPlaying = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const barsCount = 64;

  // 1. Deterministically generate beautiful static baseline heights seeded from the Track ID
  const staticHeights = useMemo(() => {
    const seed = trackId || "melody_default_seed";
    const heights: number[] = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let i = 0; i < barsCount; i++) {
      // Create a nice soundwave shape using sin + cosine blend
      const x = (i / (barsCount - 1)) * Math.PI;
      const baseWave = Math.sin(x) * 0.5 + 0.35; // nice arc curve
      const pseudoRandomNoise = Math.abs(Math.sin(hash + i * 13.7) * 0.35);
      const heightPercentage = Math.round((baseWave + pseudoRandomNoise) * 85);
      heights.push(Math.max(15, Math.min(95, heightPercentage)));
    }
    return heights;
  }, [trackId]);

  // Keep track of smoothed heights for liquid motion
  const smoothedHeightsRef = useRef<number[]>([]);
  useEffect(() => {
    smoothedHeightsRef.current = new Array(barsCount).fill(0).map((_, i) => staticHeights[i] || 20);
  }, [staticHeights]);

  // 2. Real-time draw loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : barsCount);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Update canvas resolution for high-DPI (Retina) screens to ensure crisp rendering
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Read audio frequencies
      let hasRealAnalyserData = false;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        // Check if there is actual non-zero frequency data (i.e. not silent/CORS-blocked)
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        if (sum > 0) {
          hasRealAnalyserData = true;
        }
      }

      // If no real Web Audio API data, generate procedural frequency ripples
      if (!hasRealAnalyserData && isPlaying) {
        const time = performance.now() * 0.005;
        for (let i = 0; i < barsCount; i++) {
          const wave1 = Math.sin(i * 0.15 - time * 2.2) * 0.45;
          const wave2 = Math.cos(i * 0.28 + time * 1.5) * 0.35;
          const wave3 = Math.sin(i * 0.07 + time * 0.6) * 0.25;
          const noise = Math.max(0, wave1 + wave2 + wave3 + 0.45);
          dataArray[i] = Math.floor(noise * 255 * 0.85);
        }
      } else if (!isPlaying) {
        // Mute frequencies smoothly when paused
        for (let i = 0; i < barsCount; i++) {
          dataArray[i] = Math.max(0, dataArray[i] * 0.85);
        }
      }

      // Draw the bars
      const barSpacing = 3;
      const totalSpacingWidth = barSpacing * (barsCount - 1);
      const barWidth = (width - totalSpacingWidth) / barsCount;

      const currentPercent = duration > 0 ? (progress / duration) * 100 : 0;

      // Color Gradients
      const activeGradient = ctx.createLinearGradient(0, height, 0, 0);
      activeGradient.addColorStop(0, "#8b5cf6"); // violet-500
      activeGradient.addColorStop(0.5, "#a78bfa"); // violet-400
      activeGradient.addColorStop(1, "#34d399"); // emerald-400 (pulsating neon top!)

      const inactiveGradient = ctx.createLinearGradient(0, height, 0, 0);
      inactiveGradient.addColorStop(0, "rgba(75, 85, 99, 0.4)"); // gray-600
      inactiveGradient.addColorStop(1, "rgba(55, 65, 81, 0.25)"); // gray-700

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + barSpacing);
        const staticH = staticHeights[i] || 20;

        // Map frequency data index to bars
        const freqIndex = Math.min(
          dataArray.length - 1,
          Math.floor((i / barsCount) * dataArray.length * 0.75) // Focus on lower-to-mid bands for aesthetic movement
        );
        const freqVal = dataArray[freqIndex] || 0;
        const normalizedFreq = freqVal / 255;

        // Calculate target height: a combination of static baseline shape and dynamic frequency bounces
        const dynamicFactor = isPlaying ? 0.4 + normalizedFreq * 1.3 : 1.0;
        const targetH = Math.max(12, Math.min(95, staticH * dynamicFactor));

        // Smooth height changes with dampening filter for fluid liquid waves
        const prevH = smoothedHeightsRef.current[i] || staticH;
        const currentH = prevH * 0.78 + targetH * 0.22;
        smoothedHeightsRef.current[i] = currentH;

        const drawHeight = (currentH / 100) * height;
        const y = height - drawHeight;

        const barPercent = (i / barsCount) * 100;
        const isActive = barPercent <= currentPercent;

        ctx.fillStyle = isActive ? activeGradient : inactiveGradient;

        // Add subtle shadow glow to active bars
        if (isActive && isPlaying) {
          ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw rounded rectangle
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, drawHeight, [2, 2, 0, 0]);
        } else {
          // Fallback roundRect implementation
          const r = Math.min(barWidth / 2, 2);
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + barWidth - r, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
          ctx.lineTo(x + barWidth, y + drawHeight);
          ctx.lineTo(x, y + drawHeight);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
        ctx.fill();
      }

      ctx.restore();
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [analyser, isPlaying, duration, progress, staticHeights]);

  // 3. User seeking and mouse interaction handlers
  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percent * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(percent * duration);
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      className="group relative flex flex-col justify-end h-11 w-full select-none rounded-lg transition-all"
    >
      <canvas
        ref={canvasRef}
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-11 block cursor-pointer transition-transform duration-200"
      />

      {/* Floating playhead laser line on hover */}
      {hoverX !== null && (
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-white/70 pointer-events-none z-10 transition-opacity duration-150 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `${hoverX}px` }}
        />
      )}

      {/* Futuristic seek time tooltip badge */}
      {hoverTime !== null && hoverX !== null && (
        <div
          className="absolute -top-7 bg-gray-950/90 border border-violet-500/30 text-[10px] font-mono text-emerald-300 font-bold px-2 py-0.5 rounded-md pointer-events-none z-25 transition-all duration-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)] whitespace-nowrap -translate-x-1/2"
          style={{ left: `${hoverX}px` }}
        >
          Seek to {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};
