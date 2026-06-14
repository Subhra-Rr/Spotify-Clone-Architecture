import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LyricsDisplayProps {
  artist: string;
  title: string;
  currentTime: number;
}

interface LyricLine {
  time: number;
  text: string;
}

export function LyricsDisplay({ artist, title, currentTime }: LyricsDisplayProps) {
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
  
  // Find current line
  const currentLineIndex = lyrics ? lyrics.findIndex((line, idx) => {
     const nextLine = lyrics[idx + 1];
     if (!nextLine) return currentTime >= line.time;
     return currentTime >= line.time && currentTime < nextLine.time;
  }) : -1;
  
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
       <div className="bg-[#242424] rounded-lg p-6 flex flex-col items-center justify-center min-h-[100px] mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#b3b3b3]" />
          <p className="text-[#b3b3b3] mt-4 font-bold text-sm">Loading lyrics...</p>
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
    <div className="bg-[#1e1e1e] rounded-lg overflow-hidden flex flex-col mb-4">
       <div className="px-4 py-4 shrink-0 flex items-center justify-between">
          <span className="font-bold text-white text-[15px]">Lyrics</span>
       </div>
       <div 
          ref={containerRef}
          className="px-4 pb-8 overflow-y-auto max-h-[300px] scrollbar-hide space-y-4"
          style={{ scrollBehavior: 'smooth' }}
       >
          {lyrics.map((line, idx) => {
             const isActive = idx === currentLineIndex;
             
             return (
                <div 
                   key={idx} 
                   className={`text-[18px] font-bold leading-tight transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-[#b3b3b3]'
                   }`}
                   style={{
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'left center'
                   }}
                >
                   {line.text}
                </div>
             );
          })}
       </div>
    </div>
  );
}
