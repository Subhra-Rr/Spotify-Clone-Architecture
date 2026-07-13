import React, { useState, useEffect, useRef } from "react";
import { Search, Command, Play, Music, Volume2, ShieldAlert, Navigation, Settings, Sparkles, FolderDown, BarChart2, Info, Check, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onPlayTrack: (track: Track) => void;
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleMute?: () => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  tracks: Track[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onPlayTrack,
  onTogglePlay = () => {},
  onNext = () => {},
  onPrev = () => {},
  onToggleMute = () => {},
  onOpenSettings = () => {},
  onOpenSupport = () => {},
  tracks,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Define static commands
  const navigationCommands = [
    { id: "nav-home", label: "Go to Home Feed", type: "nav", tab: "home", icon: Navigation },
    { id: "nav-search", label: "Go to Search & Explore", type: "nav", tab: "search", icon: Search },
    { id: "nav-queue", label: "Go to Current Play Queue", type: "nav", tab: "queue", icon: Music },
    { id: "nav-downloads", label: "Go to Offline Downloads", type: "nav", tab: "downloads", icon: FolderDown },
  ];

  const actionCommands = [
    { id: "act-play", label: "Play / Pause Music", type: "action", action: onTogglePlay, icon: Play },
    { id: "act-next", label: "Skip to Next Track", type: "action", action: onNext, icon: Play },
    { id: "act-prev", label: "Skip to Previous Track", type: "action", action: onPrev, icon: Play },
    { id: "act-mute", label: "Mute / Unmute Player Volume", type: "action", action: onToggleMute, icon: Volume2 },
    { id: "act-settings", label: "Open Playback Settings", type: "action", action: onOpenSettings, icon: Settings },
    { id: "act-support", label: "Contact Customer Support Help", type: "action", action: onOpenSupport, icon: HelpCircle },
  ];

  // Search filter
  const filteredNavs = query
    ? navigationCommands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : navigationCommands;

  const filteredActions = query
    ? actionCommands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : actionCommands;

  const filteredTracks = query
    ? tracks
        .filter((track) =>
          track.title.toLowerCase().includes(query.toLowerCase()) ||
          track.artist.toLowerCase().includes(query.toLowerCase()) ||
          track.album.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const allItems = [
    ...filteredNavs.map((n) => ({ ...n, id: n.id, category: "Navigation" })),
    ...filteredActions.map((a) => ({ ...a, id: a.id, category: "Actions" })),
    ...filteredTracks.map((t) => ({ ...t, id: `track-${t.id}`, label: `${t.title} - ${t.artist}`, type: "track", track: t, category: "Matching Songs" })),
  ];

  // Handle arrows and select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(allItems.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(allItems.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          triggerItem(allItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allItems]);

  // Scroll active into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const triggerItem = (item: any) => {
    if (item.type === "nav") {
      onNavigate(item.tab);
    } else if (item.type === "action") {
      item.action();
    } else if (item.type === "track") {
      onPlayTrack(item.track);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] backdrop-blur-md flex items-start justify-center pt-[10vh] px-4">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            className="bg-[#181818] border border-[#2b2b2b] max-w-2xl w-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[70vh] z-50"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2b2b2b] relative bg-[#202020]">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a song, navigation link, or system control..."
                className="bg-transparent text-white text-base w-full focus:outline-none placeholder-gray-500"
              />
              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 uppercase font-mono shadow-sm">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            {/* List Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {allItems.length === 0 ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <ShieldAlert className="w-8 h-8 text-gray-500" />
                  <span className="text-sm font-bold">No results found for "{query}"</span>
                  <span className="text-xs text-gray-500">Try searching for simple commands like 'play' or tab names like 'library'</span>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {/* Group items by category */}
                  {Array.from(new Set(allItems.map((i) => i.category))).map((cat) => {
                    const groupItems = allItems.filter((i) => i.category === cat);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="px-3 pt-2 text-[10px] font-black uppercase tracking-wider text-gray-500 font-sans">
                          {cat}
                        </div>
                        {groupItems.map((item) => {
                          const itemIndex = allItems.indexOf(item);
                          const isActive = itemIndex === selectedIndex;
                          const itemCast = item as any;
                          const Icon = itemCast.icon || Music;

                          return (
                            <div
                              key={`${item.id}-${itemIndex}`}
                              data-active={isActive}
                              onClick={() => triggerItem(item)}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? "bg-[#8b5cf6] text-white shadow-lg"
                                  : "text-gray-300 hover:bg-[#232323] hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {itemCast.type === "track" && itemCast.track?.coverUrl ? (
                                  <img
                                    src={itemCast.track.coverUrl}
                                    alt=""
                                    className="w-7 h-7 rounded object-cover shadow-sm shrink-0"
                                  />
                                ) : (
                                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-white/5 text-gray-400"}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                )}
                                <span className="text-xs font-bold truncate">{itemCast.label}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isActive && (
                                  <span className="text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded bg-white/20 text-white font-sans flex items-center gap-1">
                                    <span>Execute</span>
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hint Footer */}
            <div className="px-4 py-2 bg-[#121212] border-t border-[#2b2b2b] text-[10px] text-gray-500 font-sans flex items-center justify-between">
              <span>Use <kbd className="bg-[#202020] px-1 py-0.5 rounded">↑↓</kbd> to navigate, <kbd className="bg-[#202020] px-1 py-0.5 rounded">Enter</kbd> to execute, <kbd className="bg-[#202020] px-1 py-0.5 rounded">ESC</kbd> to close.</span>
              <span>MelodyStream Navigator</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default CommandPalette;
