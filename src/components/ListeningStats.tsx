import React, { useEffect, useState } from "react";
import { BarChart3, Clock, Trophy, Disc, Play, Sparkles, RefreshCw, Command } from "lucide-react";
import { motion } from "motion/react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
}

interface ListeningStatsProps {
  onPlayTrack: (track: Track) => void;
}

interface PlayHistoryItem {
  track: Track;
  playedAt: number;
}

export function ListeningStats({ onPlayTrack }: ListeningStatsProps) {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [topTracks, setTopTracks] = useState<{ track: Track; count: number }[]>([]);
  const [topArtists, setTopArtists] = useState<{ name: string; count: number }[]>([]);
  const [timeSpent, setTimeSpent] = useState(0); // in minutes

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const rawHistory = localStorage.getItem("melodystream-play-history");
      if (rawHistory) {
        const parsed: PlayHistoryItem[] = JSON.parse(rawHistory);
        setHistory(parsed);

        // 1. Calculate Top Tracks
        const trackCounts: Record<string, { track: Track; count: number }> = {};
        parsed.forEach((item) => {
          const id = item.track.id;
          if (trackCounts[id]) {
            trackCounts[id].count += 1;
          } else {
            trackCounts[id] = { track: item.track, count: 1 };
          }
        });
        const sortedTracks = Object.values(trackCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopTracks(sortedTracks);

        // 2. Calculate Top Artists
        const artistCounts: Record<string, number> = {};
        parsed.forEach((item) => {
          const artist = item.track.artist;
          artistCounts[artist] = (artistCounts[artist] || 0) + 1;
        });
        const sortedArtists = Object.entries(artistCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopArtists(sortedArtists);

        // 3. Estimate Listening Time (approx 3 minutes per track)
        setTimeSpent(parsed.length * 3);
      }
    } catch (e) {
      console.warn("Could not load listening history:", e);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("melodystream-play-history");
    setHistory([]);
    setTopTracks([]);
    setTopArtists([]);
    setTimeSpent(0);
  };

  const getWeeklyTrendData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    history.forEach((item) => {
      const dayIndex = new Date(item.playedAt).getDay();
      counts[dayIndex] += 1;
    });

    const maxCount = Math.max(...counts, 1);
    return days.map((name, i) => ({
      day: name,
      count: counts[i],
      height: (counts[i] / maxCount) * 80 + 10 // scale to max 90px
    }));
  };

  const getDailyStreak = () => {
    if (history.length === 0) return 0;
    
    // Sort descending and extract unique dates
    const uniqueDays = Array.from(
      new Set(
        history.map((item) => {
          const d = new Date(item.playedAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })
      )
    ).sort((a, b) => b.localeCompare(a));

    if (uniqueDays.length === 0) return 0;

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const yesterdayStr = (() => {
      const d = new Date(Date.now() - 86400000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const d1 = new Date(uniqueDays[i]);
      const d2 = new Date(uniqueDays[i + 1]);
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / 86400000);
      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  const getHeatmapData = () => {
    const weeksCount = 12;
    const totalDays = weeksCount * 7;
    const countsMap: Record<string, number> = {};
    
    history.forEach((item) => {
      const d = new Date(item.playedAt);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      countsMap[str] = (countsMap[str] || 0) + 1;
    });

    const heatmapCells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today.getTime() - (totalDays - 1) * 86400000);

    for (let i = 0; i < totalDays; i++) {
      const cellDate = new Date(startDate.getTime() + i * 86400000);
      const str = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
      const count = countsMap[str] || 0;
      
      heatmapCells.push({
        dateStr: str,
        count,
        dayOfWeek: cellDate.getDay(),
        dateLabel: cellDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      });
    }

    const columns = [];
    for (let w = 0; w < weeksCount; w++) {
      columns.push(heatmapCells.slice(w * 7, (w + 1) * 7));
    }
    return columns;
  };

  const weeklyTrends = getWeeklyTrendData();
  const dailyStreak = getDailyStreak();
  const heatmapData = getHeatmapData();

  return (
    <div className="space-y-8 text-white font-sans p-6 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#282828] pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Your Listening Wrapped</h2>
          <p className="text-[#b3b3b3] text-sm mt-1">Explore your play statistics, top artists, and musical trends</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={loadStats}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-gray-300 hover:text-white cursor-pointer transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#8b5cf6]">
            <Disc className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No listening history yet</h3>
            <p className="text-gray-400 text-xs max-w-xs mx-auto mt-1 leading-relaxed">
              Start playing your favorite music tracks on MelodyStream, and we will automatically map your musical statistics!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Indicators Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent,#8b5cf6)]/10 text-[var(--color-accent,#8b5cf6)] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Listening Time</span>
                <span className="text-2xl font-black">{timeSpent} min</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Plays Recorded</span>
                <span className="text-2xl font-black">{history.length} songs</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Favorite Artist</span>
                <span className="text-2xl font-black truncate block">
                  {topArtists[0]?.name || "N/A"}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Daily Streak</span>
                <span className="text-2xl font-black">{dailyStreak} day{dailyStreak !== 1 ? "s" : ""} 🔥</span>
              </div>
            </div>
          </div>

          {/* Heatmap Activity Block (Full Width) */}
          <div className="p-6 rounded-2xl bg-[#121212] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-[#a78bfa]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Listening Activity Heatmap (Last 12 Weeks)</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Intensity: Light (1 play) to Vibrant Purple (4+ plays)</span>
            </div>

            <div className="flex overflow-x-auto no-scrollbar pb-2 pt-2 justify-center lg:justify-start">
              <div className="flex gap-1.5 shrink-0 select-none">
                {/* Heatmap Day Labels */}
                <div className="flex flex-col justify-between text-[10px] text-gray-500 pr-2 pb-5 font-mono">
                  <span>Sun</span>
                  <span>Tue</span>
                  <span>Thu</span>
                  <span>Sat</span>
                </div>

                {heatmapData.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      // Style depending on frequency
                      let bgClass = "bg-white/5 hover:bg-white/10";
                      if (day.count === 1) bgClass = "bg-purple-900/40 text-purple-200 border border-purple-500/10";
                      else if (day.count === 2) bgClass = "bg-purple-800/60 text-purple-100 border border-purple-500/20";
                      else if (day.count === 3) bgClass = "bg-purple-600/80 text-white";
                      else if (day.count >= 4) bgClass = "bg-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]";

                      return (
                        <div
                          key={day.dateStr}
                          title={`${day.dateLabel}: ${day.count} song${day.count !== 1 ? "s" : ""} played`}
                          className={`w-[14px] h-[14px] rounded-sm transition-all duration-200 cursor-pointer ${bgClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Analytics Split Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Artists & Weekly Trends */}
            <div className="space-y-6">
              {/* Weekly Trends SVG Graph */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[var(--color-accent,#8b5cf6)]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Play Activity</h3>
                </div>

                <div className="flex items-end justify-between h-28 pt-4 px-2">
                  {weeklyTrends.map((d, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-7 bg-white/5 rounded-t-lg overflow-hidden flex items-end h-24">
                        {/* Dynamic Accent Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${d.height}%` }}
                          transition={{ type: "spring", stiffness: 60 }}
                          className="w-full bg-gradient-to-t from-[var(--color-accent,#8b5cf6)] to-[#ec4899]"
                        />
                        {/* Hover Overlay value */}
                        <div className="absolute top-1 left-0 right-0 text-[9px] font-black text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.count}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold mt-2">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Artists Ranking */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Top 5 Artists</h3>
                <div className="space-y-3">
                  {topArtists.map((artist, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-sm font-bold text-gray-500 text-center">{idx + 1}</span>
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-[var(--color-accent,#8b5cf6)] uppercase">
                          {artist.name[0]}
                        </div>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{artist.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <span>{artist.count} play{artist.count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Tracks List */}
            <div className="p-6 rounded-2xl bg-[#121212] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Heavy Rotation</h3>
                <span className="text-[11px] text-[#a78bfa] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Top Songs
                </span>
              </div>

              <div className="space-y-3">
                {topTracks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all border border-white/[0.02] group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-5 text-sm font-bold text-gray-500 text-center">{idx + 1}</span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-[#282828]">
                        <img src={item.track.coverUrl} alt={item.track.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => onPlayTrack(item.track)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Play className="w-4 h-4 text-white fill-current" />
                        </button>
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-[var(--color-accent,#8b5cf6)] transition-colors">{item.track.title}</h4>
                        <p className="text-xs text-gray-400 truncate">{item.track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-gray-400 font-bold">{item.count} play{item.count > 1 ? "s" : ""}</span>
                      <span className="text-xs text-gray-500 hidden sm:block">{item.track.duration || "2:50"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Utility function to log a play event from any playback handler
export const recordPlayInHistory = (track: Track) => {
  try {
    const rawHistory = localStorage.getItem("melodystream-play-history");
    const parsed: PlayHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
    
    // Add new item with current timestamp
    parsed.unshift({ track, playedAt: Date.now() });
    
    // Cap history length to top 200 items to prevent bloating
    const capped = parsed.slice(0, 200);
    localStorage.setItem("melodystream-play-history", JSON.stringify(capped));
  } catch (e) {
    console.warn("Could not write play history:", e);
  }
};

export default ListeningStats;
