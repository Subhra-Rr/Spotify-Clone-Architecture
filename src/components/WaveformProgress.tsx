import React, { useMemo } from "react";

interface WaveformProgressProps {
  trackId: string | null;
  progress: number; // in seconds
  duration: number; // in seconds
  onSeek: (time: number) => void;
}

export const WaveformProgress: React.FC<WaveformProgressProps> = ({
  trackId,
  progress,
  duration,
  onSeek,
}) => {
  const barsCount = 64;

  // Determinisitcally generate beautiful waveform heights seeded from the Track ID
  const barHeights = useMemo(() => {
    const seed = trackId || "melody_default_seed";
    const heights: number[] = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let i = 0; i < barsCount; i++) {
      // Create a wave shape blended with hash noise
      const x = (i / (barsCount - 1)) * Math.PI;
      const baseWave = Math.sin(x) * 0.5 + 0.3; // nice arc curve
      const pseudoRandomNoise = Math.abs(Math.sin(hash + i * 17.3) * 0.4);
      const heightPercentage = Math.round((baseWave + pseudoRandomNoise) * 100);
      heights.push(Math.max(12, Math.min(95, heightPercentage)));
    }
    return heights;
  }, [trackId]);

  const currentPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = clickX / rect.width;
    onSeek(newPercent * duration);
  };

  return (
    <div
      onClick={handleSeek}
      className="group relative flex items-end justify-between h-11 w-full cursor-pointer select-none px-1 py-1 bg-gray-900/10 hover:bg-gray-800/10 rounded-lg transition-all"
    >
      {barHeights.map((height, idx) => {
        const barPercent = (idx / barsCount) * 100;
        const isActive = barPercent <= currentPercent;

        return (
          <div
            key={idx}
            style={{ height: `${height}%` }}
            className={`w-[3px] rounded-full transition-all duration-150 ${
              isActive
                ? "bg-emerald-400 group-hover:bg-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                : "bg-gray-700/60 group-hover:bg-gray-600/60"
            }`}
          />
        );
      })}

      {/* Floating Time Hover Tooltip */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-950/80 border border-gray-800 text-[10px] font-mono px-1.5 py-0.5 rounded-md pointer-events-none transition-all duration-200">
        Click anywhere to seek
      </div>
    </div>
  );
};
