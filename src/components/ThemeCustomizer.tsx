import React, { useState, useEffect } from "react";
import { Palette, Layers, Moon, Clock, Sparkles } from "lucide-react";

interface ThemeCustomizerProps {
  onSleepTimerSet: (minutes: number | null) => void;
  activeSleepTimer: number | null; // remaining seconds
  showToast: (message: string, type: "info" | "error" | "success") => void;
  userId?: string;
}

export const ACCENT_COLORS = [
  { name: "Amethyst (Default)", hex: "#8b5cf6", hover: "#7c3aed", nameId: "violet" },
  { name: "Spotify Green", hex: "#1db954", hover: "#1aa34a", nameId: "green" },
  { name: "Cyan Breeze", hex: "#06b6d4", hover: "#0891b2", nameId: "cyan" },
  { name: "Amber Gold", hex: "#f59e0b", hover: "#d97706", nameId: "amber" },
  { name: "Neon Rose", hex: "#ec4899", hover: "#db2777", nameId: "rose" },
  { name: "Deep Ocean", hex: "#3b82f6", hover: "#2563eb", nameId: "blue" },
];

export const BACKGROUNDS = [
  { name: "Midnight Black", from: "#000000", to: "#000000", key: "black" },
  { name: "Amethyst Dusk", from: "#1e1333", to: "#05030a", key: "amethyst" },
  { name: "Nordic Frost", from: "#0f172a", to: "#020617", key: "frost" },
  { name: "Crimson Velvet", from: "#2b0d18", to: "#070206", key: "crimson" },
  { name: "Emerald Glade", from: "#062419", to: "#020805", key: "glade" },
];

export function ThemeCustomizer({ onSleepTimerSet, activeSleepTimer, showToast, userId }: ThemeCustomizerProps) {
  const isRealUser = userId && userId !== "guest_user";
  const uid = isRealUser ? userId : "guest";

  const [selectedAccent, setSelectedAccent] = useState(() => localStorage.getItem(`theme-accent:${uid}`) || "#8b5cf6");
  const [selectedBg, setSelectedBg] = useState(() => localStorage.getItem(`theme-bg:${uid}`) || "black");
  const [glassmorphism, setGlassmorphism] = useState(() => localStorage.getItem(`theme-glass:${uid}`) !== "false");
  const [customTimerMin, setCustomTimerMin] = useState("");

  useEffect(() => {
    // Apply Accent Color to Document Root
    const accent = ACCENT_COLORS.find(c => c.hex === selectedAccent) || ACCENT_COLORS[0];
    document.documentElement.style.setProperty("--color-accent", accent.hex);
    document.documentElement.style.setProperty("--color-accent-hover", accent.hover);
    document.documentElement.style.setProperty("--color-accent-rgb", hexToRgb(accent.hex));
    if (isRealUser) {
      localStorage.setItem(`theme-accent:${uid}`, accent.hex);
    }
  }, [selectedAccent, uid, isRealUser]);

  useEffect(() => {
    // Apply Background
    const bg = BACKGROUNDS.find(b => b.key === selectedBg) || BACKGROUNDS[0];
    document.documentElement.style.setProperty("--theme-bg-from", bg.from);
    document.documentElement.style.setProperty("--theme-bg-to", bg.to);
    if (isRealUser) {
      localStorage.setItem(`theme-bg:${uid}`, selectedBg);
    }
    
    // Dispatch custom event to trigger dashboard background redraw
    window.dispatchEvent(new CustomEvent("theme-bg-changed", { detail: bg }));
  }, [selectedBg, uid, isRealUser]);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-glass", glassmorphism ? "true" : "false");
    if (isRealUser) {
      localStorage.setItem(`theme-glass:${uid}`, String(glassmorphism));
    }
  }, [glassmorphism, uid, isRealUser]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "139, 92, 246";
  };

  const handleSetTimer = (min: number | null) => {
    onSleepTimerSet(min);
    if (min) {
      showToast(`Sleep timer set for ${min} minutes`, "success");
    } else {
      showToast("Sleep timer cancelled", "info");
    }
  };

  const formatRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Accent Color Picker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--color-accent,#8b5cf6)]" />
          <h4 className="text-sm font-bold text-white">Brand Accent Color</h4>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => setSelectedAccent(color.hex)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95] ${selectedAccent === color.hex ? "border-white bg-white/10" : "border-white/5 bg-white/[0.02]"}`}
            >
              <span
                className="w-6 h-6 rounded-full border border-white/20 shadow-md mb-1.5"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-[10px] text-gray-300 font-medium text-center truncate w-full">
                {color.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Background Customizer */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[var(--color-accent,#8b5cf6)]" />
          <h4 className="text-sm font-bold text-white">Immersive Player Background</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.key}
              onClick={() => setSelectedBg(bg.key)}
              className={`flex flex-col items-left p-2.5 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.03] ${selectedBg === bg.key ? "border-white bg-white/10" : "border-white/5 bg-white/[0.02]"}`}
            >
              <div
                className="w-full h-8 rounded-lg mb-2 shadow-inner border border-white/5"
                style={{ background: `linear-gradient(135deg, ${bg.from}, ${bg.to})` }}
              />
              <span className="text-[11px] text-white font-bold block truncate">
                {bg.name.split(" ")[0]}
              </span>
              <span className="text-[9px] text-gray-400 block truncate">
                {bg.key === "black" ? "Amoled Black" : "Ambient Glow"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Glassmorphic Paneling Toggle */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--color-accent,#8b5cf6)]" />
          <div>
            <h4 className="text-sm font-bold text-white">Glassmorphic HUD Panels</h4>
            <span className="text-xs text-gray-400">Add glassy translucent blur effects to standard panels</span>
          </div>
        </div>
        <button
          onClick={() => setGlassmorphism(prev => !prev)}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${glassmorphism ? "bg-[var(--color-accent,#8b5cf6)]" : "bg-[#404040]"}`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${glassmorphism ? "right-1" : "left-1"}`}
          />
        </button>
      </div>

      {/* Sleep Timer Countdown */}
      <div className="pt-4 border-t border-[#282828] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-accent,#8b5cf6)]" />
            <div>
              <h4 className="text-sm font-bold text-white">Sleep Timer</h4>
              <span className="text-xs text-gray-400">Automatically pause playback after a set time</span>
            </div>
          </div>
          {activeSleepTimer !== null && (
            <div className="flex items-center gap-1.5 bg-[#8b5cf6]/10 px-2.5 py-1 rounded-full border border-[#8b5cf6]/20 animate-pulse text-xs text-[var(--color-accent,#8b5cf6)] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{formatRemaining(activeSleepTimer)} left</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[5, 15, 30, 45, 60].map((min) => (
            <button
              key={min}
              onClick={() => handleSetTimer(min)}
              className="py-1.5 px-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 text-xs text-center font-bold text-gray-300 hover:text-white cursor-pointer transition-colors"
            >
              {min}m
            </button>
          ))}
          <button
            onClick={() => handleSetTimer(null)}
            className="py-1.5 px-3 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-xs text-center font-bold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="240"
            value={customTimerMin}
            onChange={(e) => setCustomTimerMin(e.target.value)}
            placeholder="Custom minutes..."
            className="flex-1 bg-black/40 border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 text-xs focus:border-[var(--color-accent,#8b5cf6)] focus:outline-none transition-colors"
          />
          <button
            onClick={() => {
              const num = parseInt(customTimerMin, 10);
              if (num > 0) {
                handleSetTimer(num);
                setCustomTimerMin("");
              } else {
                showToast("Please enter a valid number of minutes", "error");
              }
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
