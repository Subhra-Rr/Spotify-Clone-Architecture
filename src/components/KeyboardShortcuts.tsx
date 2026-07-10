import React, { useEffect, useState } from "react";
import { Keyboard, X, Play, Pause, FastForward, Rewind, Volume2, Shuffle, Repeat, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KeyboardShortcutsProps {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleCommandPalette?: () => void;
}

export function KeyboardShortcuts({
  onTogglePlay,
  onNext,
  onPrev,
  onSeekForward,
  onSeekBackward,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleCommandPalette,
}: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle Command Palette globally (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (onToggleCommandPalette) {
          onToggleCommandPalette();
        }
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          onTogglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeekForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onSeekBackward();
          break;
        case "ArrowUp":
          e.preventDefault();
          onVolumeUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          onVolumeDown();
          break;
        case "m":
        case "M":
          onToggleMute();
          break;
        case "n":
        case "N":
          onNext();
          break;
        case "p":
        case "P":
          onPrev();
          break;
        case "s":
        case "S":
          onToggleShuffle();
          break;
        case "r":
        case "R":
          onToggleRepeat();
          break;
        case "?":
          e.preventDefault();
          setIsOpen((prev) => !prev);
          break;
        case "Escape":
          if (isOpen) {
            setIsOpen(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    onTogglePlay,
    onNext,
    onPrev,
    onSeekForward,
    onSeekBackward,
    onVolumeUp,
    onVolumeDown,
    onToggleMute,
    onToggleShuffle,
    onToggleRepeat,
    onToggleCommandPalette,
  ]);

  const shortcutsList = [
    { key: "Space", desc: "Play / Pause", icon: Play },
    { key: "Ctrl + K", desc: "Command Palette", icon: Keyboard },
    { key: "Arrow Right", desc: "Skip Forward 10s", icon: FastForward },
    { key: "Arrow Left", desc: "Skip Backward 10s", icon: Rewind },
    { key: "Arrow Up", desc: "Volume Up 10%", icon: Volume2 },
    { key: "Arrow Down", desc: "Volume Down 10%", icon: Volume2 },
    { key: "N", desc: "Next Track", icon: FastForward },
    { key: "P", desc: "Previous Track", icon: Rewind },
    { key: "M", desc: "Mute / Unmute", icon: Volume2 },
    { key: "S", desc: "Toggle Shuffle", icon: Shuffle },
    { key: "R", desc: "Cycle Repeat Mode", icon: Repeat },
    { key: "?", desc: "Show / Hide Guide", icon: Info },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 z-[500] backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#121212] border border-[#282828] max-w-lg w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#8b5cf6]/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-[#282828] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-[#a78bfa]">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Keyboard Shortcuts</h3>
                    <p className="text-xs text-gray-400">Streamline your listening experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#282828] text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {shortcutsList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-300">{item.desc}</span>
                    </div>
                    <kbd className="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono text-white bg-[#282828] border border-white/10 shadow-md">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#282828] text-center text-[11px] text-gray-500 mt-2">
                Press any of these shortcuts anywhere while viewing MelodyStream to control playback.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export default KeyboardShortcuts;
