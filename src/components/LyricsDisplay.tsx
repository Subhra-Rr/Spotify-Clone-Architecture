import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LyricsDisplayProps {
  artist: string;
  title: string;
  currentTime: number;
  duration?: number;
}

interface LyricLine {
  time: number;
  text: string;
}

export function LyricsDisplay({ artist, title, currentTime, duration }: LyricsDisplayProps) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const outerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const currentRequestRef = useRef<string>('');

  // Translation states for high-performance touch/drag on mobile & desktop
  const [translateY, setTranslateY] = useState<number>(150);
  const [isDragging, setIsDragging] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Sync tuner offset
  const isPreview = duration && duration > 0 && duration < 45;
  const [lyricsOffset, setLyricsOffset] = useState<number>(0);

  // Drag interaction refs to prevent re-renders on mousemove
  const dragStartY = useRef<number>(0);
  const dragStartTranslateY = useRef<number>(0);
  const hasDragged = useRef<boolean>(false);

  useEffect(() => {
    // Reset offset and scrolling lock when song changes
    setLyricsOffset(isPreview ? 30 : 0);
    setUserHasScrolled(false);
    setTranslateY(150);
  }, [artist, title, isPreview]);

  useEffect(() => {
    const fetchLyrics = async () => {
      const requestId = `${artist}-${title}`;
      currentRequestRef.current = requestId;
      
      setLoading(true);
      setError(null);
      setLyrics(null);
      
      try {
        // Try precise match first
        let url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
        let res = await fetch(url);
        let data = await res.json();
        
        let syncedLyrics = data?.syncedLyrics;
        
        // Fallback to search
        if (!syncedLyrics) {
            url = `https://lrclib.net/api/search?q=${encodeURIComponent(title + ' ' + artist)}`;
            res = await fetch(url);
            data = await res.json();
            
            if (Array.isArray(data) && data.length > 0) {
                // Find first item with syncedLyrics
                const item = data.find((d: any) => d.syncedLyrics);
                if (item) {
                   syncedLyrics = item.syncedLyrics;
                }
            }
        }
        
        if (currentRequestRef.current !== requestId) return;
        
        if (syncedLyrics) {
           const parsed = parseLrc(syncedLyrics);
           setLyrics(parsed);
        } else {
           setError("No lyrics found");
        }
      } catch (err) {
        if (currentRequestRef.current === requestId) {
           setError("Failed to load lyrics");
        }
      } finally {
        if (currentRequestRef.current === requestId) {
           setLoading(false);
        }
      }
    };
    
    if (artist && title) {
        fetchLyrics();
    }
  }, [artist, title]);
  
  // Parse LRC format
  const parseLrc = (lrc: string): LyricLine[] => {
    const lines = lrc.split('\n');
    const parsed: LyricLine[] = [];
    const timeRegEx = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    for (const line of lines) {
       const match = timeRegEx.exec(line);
       if (match) {
         const m = parseInt(match[1], 10);
         const s = parseInt(match[2], 10);
         const ms = parseInt(match[3], 10);
         
         const time = m * 60 + s + (ms / (match[3].length === 2 ? 100 : 1000));
         const text = line.replace(timeRegEx, '').trim();
         
         if (text) {
             parsed.push({ time, text });
         }
       }
    }
    
    return parsed;
  };

  // Compute 1:1 real-time adjusted progress
  const adjustedTime = currentTime + lyricsOffset;
  
  // Find current line with smart intro/pre-first-line matching
  let currentLineIndex = -1;
  if (lyrics && lyrics.length > 0) {
    if (adjustedTime < lyrics[0].time) {
      currentLineIndex = 0; // Pre-highlight first line in intro state
    } else {
      currentLineIndex = lyrics.findIndex((line, idx) => {
        const nextLine = lyrics[idx + 1];
        if (!nextLine) return adjustedTime >= line.time;
        return adjustedTime >= line.time && adjustedTime < nextLine.time;
      });
    }
  }

  // Handle automatic scrolling via translateY CSS transformation
  useEffect(() => {
    if (currentLineIndex !== -1 && listRef.current && !userHasScrolled && !isDragging) {
       const activeLine = listRef.current.children[currentLineIndex] as HTMLElement;
       if (activeLine) {
          const containerHeight = 300; // Fixed visual container height
          const activeLineTop = activeLine.offsetTop;
          const activeLineHeight = activeLine.clientHeight;
          
          const targetY = (containerHeight / 2) - activeLineTop - (activeLineHeight / 2);
          setTranslateY(targetY);
       }
    }
  }, [currentLineIndex, userHasScrolled, isDragging, lyrics]);

  // Pointer event handlers to manage manual dragging on mobile & desktop smoothly
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Enable pointer capture to track moves outside container boundaries safely
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartY.current = e.clientY;
    dragStartTranslateY.current = translateY;
    setIsDragging(true);
    hasDragged.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - dragStartY.current;
    
    if (Math.abs(deltaY) > 6) {
      hasDragged.current = true;
      setUserHasScrolled(true);
    }
    
    const newTranslateY = dragStartTranslateY.current + deltaY;
    
    // Bounds clamping: don't let user scroll past content limits
    const listHeight = listRef.current ? listRef.current.clientHeight : 300;
    const minY = 150 - listHeight;
    const maxY = 150;
    
    // Add slightly bouncy edge friction
    let clampedY = newTranslateY;
    if (newTranslateY > maxY) {
      clampedY = maxY + (newTranslateY - maxY) * 0.3;
    } else if (newTranslateY < minY) {
      clampedY = minY + (newTranslateY - minY) * 0.3;
    }
    
    setTranslateY(clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    // Hard clamps back to boundaries if they were in the friction zone
    const listHeight = listRef.current ? listRef.current.clientHeight : 300;
    const minY = 150 - listHeight;
    const maxY = 150;
    
    if (translateY > maxY) {
      setTranslateY(maxY);
    } else if (translateY < minY) {
      setTranslateY(minY);
    }
  };

  const handleSync = () => {
    setUserHasScrolled(false);
  };

  const handleLyricClick = (lineTime: number) => {
    // If the pointer interaction was a scroll/drag gesture, ignore click
    if (hasDragged.current) return;

    const newOffset = lineTime - currentTime;
    setLyricsOffset(newOffset);
    setUserHasScrolled(false);
  };

  const handleAdjustOffset = (seconds: number) => {
    setLyricsOffset(prev => prev + seconds);
    setUserHasScrolled(false);
  };

  if (loading) {
    return (
        <div className="bg-[#242424]/30 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[120px] mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
            <p className="text-[#b3b3b3] mt-3 font-semibold text-sm">Synchronizing lyrics...</p>
        </div>
    );
  }
  
  if (error) {
     return null;
  }
  
  if (!lyrics || lyrics.length === 0) {
        return null;
  }
  
  return (
    <div className="bg-[#181818]/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col mb-4 p-4 backdrop-blur-md relative select-none">
         <div className="pb-3 shrink-0 flex items-center justify-between border-b border-white/5 mb-3">
            <span className="font-bold text-white text-[15px] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse" />
              Live Synced Lyrics
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 text-white/70 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Tap line to sync
              </span>
              {isPreview && (
                <span className="text-[10px] bg-[#8b5cf6]/20 text-[#c084fc] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Preview Fit
                </span>
              )}
            </div>
         </div>

         {/* Beautiful Sync Tuner Controls */}
         <div className="flex flex-wrap items-center justify-between bg-white/5 rounded-xl px-3 py-2 mb-3 text-xs border border-white/5 gap-2">
           <span className="text-white/60 font-medium flex items-center gap-1.5">
             <svg className="w-3.5 h-3.5 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             Sync Tuner: <span className="text-[#a78bfa] font-extrabold">{lyricsOffset >= 0 ? `+${lyricsOffset.toFixed(1)}s` : `${lyricsOffset.toFixed(1)}s`}</span>
           </span>
           <div className="flex items-center gap-1.5">
             <button 
               onClick={() => handleAdjustOffset(-5)}
               className="bg-white/5 hover:bg-white/10 text-white/90 active:scale-95 transition-all px-2 py-1 rounded font-bold border border-white/5 cursor-pointer"
               title="Shift lyrics 5 seconds backward"
             >
               -5s
             </button>
             <button 
               onClick={() => handleAdjustOffset(-1)}
               className="bg-white/5 hover:bg-white/10 text-white/90 active:scale-95 transition-all px-2 py-1 rounded font-bold border border-white/5 cursor-pointer"
               title="Shift lyrics 1 second backward"
             >
               -1s
             </button>
             <button 
               onClick={() => handleAdjustOffset(1)}
               className="bg-white/5 hover:bg-white/10 text-white/90 active:scale-95 transition-all px-2 py-1 rounded font-bold border border-white/5 cursor-pointer"
               title="Shift lyrics 1 second forward"
             >
               +1s
             </button>
             <button 
               onClick={() => handleAdjustOffset(5)}
               className="bg-white/5 hover:bg-white/10 text-white/90 active:scale-95 transition-all px-2 py-1 rounded font-bold border border-white/5 cursor-pointer"
               title="Shift lyrics 5 seconds forward"
             >
               +5s
             </button>
             <button 
               onClick={() => {
                 setLyricsOffset(0);
                 setUserHasScrolled(false);
               }}
               className="bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#c084fc] active:scale-95 transition-all px-2 py-1 rounded font-bold border border-[#8b5cf6]/20 ml-1 cursor-pointer"
               title="Reset offset to 0s"
             >
               Reset
             </button>
           </div>
         </div>

         {/* Outer Container with absolute touch mask */}
         <div 
           ref={outerRef}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onPointerCancel={handlePointerUp}
           className="relative h-[300px] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
           style={{
             maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
           }}
         >
           {/* Inner container driven by TranslateY with hardware acceleration */}
           <div 
              ref={listRef}
              className="px-2 py-[140px] space-y-6 absolute left-0 right-0 top-0"
              style={{ 
                transform: `translate3d(0, ${translateY}px, 0)`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
           >
              {lyrics.map((line, idx) => {
                 const isActive = idx === currentLineIndex;
                 
                 return (
                    <div 
                       key={idx} 
                       onClick={() => handleLyricClick(line.time)}
                       className={`text-[19px] font-bold leading-snug transition-all duration-300 cursor-pointer ${
                          isActive 
                            ? 'text-white drop-shadow-[0_0_12px_rgba(167,139,250,0.4)] opacity-100 scale-[1.04]' 
                            : 'text-[#ffffff]/35 hover:text-[#ffffff]/60'
                       }`}
                       style={{
                          transformOrigin: 'left center'
                       }}
                    >
                       {line.text}
                    </div>
                 );
              })}
           </div>
           
           {/* Sync to current button */}
           {userHasScrolled && (
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
               <button 
                 onClick={handleSync}
                 className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg active:scale-95 transition-transform cursor-pointer"
               >
                 <svg className="w-3.5 h-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                 </svg>
                 Sync to current
               </button>
             </div>
           )}
         </div>
    </div>
  );
}
