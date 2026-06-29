import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track id for preventing race conditions
  const currentRequestRef = useRef<string>('');

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

  // 1. Intelligently map time if playing a 30-second preview of a full track
  const lastLyricTime = lyrics && lyrics.length > 0 ? lyrics[lyrics.length - 1].time : 0;
  const isPreview = duration && duration > 0 && duration < 45;
  const adjustedTime = (isPreview && lastLyricTime > 45)
    ? (currentTime / duration) * lastLyricTime
    : currentTime;
  
  // 2. Find current line with smart intro/pre-first-line matching
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
  
  useEffect(() => {
     // Scroll to active line
     if (currentLineIndex !== -1 && containerRef.current) {
        const lineEl = containerRef.current.children[currentLineIndex] as HTMLElement;
        if (lineEl) {
           lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
     }
  }, [currentLineIndex]);

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
    <div className="bg-[#181818]/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col mb-4 p-4 backdrop-blur-md">
        <div className="pb-3 shrink-0 flex items-center justify-between border-b border-white/5 mb-4">
           <span className="font-bold text-white text-[15px] flex items-center gap-2">
             <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse" />
             Live Synced Lyrics
           </span>
           {isPreview && (
             <span className="text-[10px] bg-[#8b5cf6]/20 text-[#c084fc] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
               Preview Fit
             </span>
           )}
        </div>
        <div 
          className="relative max-h-[320px] overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
          }}
        >
          <div 
             ref={containerRef}
             className="px-2 py-6 overflow-y-auto max-h-[300px] scrollbar-hide space-y-5"
             style={{ scrollBehavior: 'smooth' }}
          >
             {lyrics.map((line, idx) => {
                const isActive = idx === currentLineIndex;
                
                return (
                   <div 
                      key={idx} 
                      className={`text-[19px] font-bold leading-snug transition-all duration-300 cursor-pointer ${
                         isActive 
                           ? 'text-white drop-shadow-[0_0_12px_rgba(167,139,250,0.4)] opacity-100 scale-[1.04]' 
                           : 'text-[#ffffff]/40 hover:text-[#ffffff]/70'
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
        </div>
    </div>
  );
}
