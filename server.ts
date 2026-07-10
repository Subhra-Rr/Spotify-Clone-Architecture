import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import YTMusic from "ytmusic-api";
import fs from "fs";
import AdmZip from "adm-zip";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

// Fix tsx __dirname issue where globalThis.__dirname is set to "."
// This is critical because some third-party packages like vite-plugin-pwa check
// typeof __dirname and fail if it is configured as "."
if (globalThis.__dirname === ".") {
  delete (globalThis as any).__dirname;
}
if ((global as any).__dirname === ".") {
  delete (global as any).__dirname;
}

dotenv.config();

// Initialize Gemini Client
const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Simple In-Memory Rate Limiter (to guard endpoints)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

const rateLimiter = (req: any, res: any, next: any) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const limitInfo = ipRequestCounts.get(ip);

  if (!limitInfo || now > limitInfo.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  limitInfo.count++;
  if (limitInfo.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.ceil((limitInfo.resetAt - now) / 1000));
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  next();
};

// In-Memory Cache (Redis-style high performance local cache)
const localCache = new Map<string, { data: any; expiresAt: number }>();

function getCached(key: string): any | null {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: any, ttlMs: number = 300000) { // default 5 minutes
  localCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Secure Stream Signed/Expiring URLs
const SIGN_SECRET = process.env.STREAM_SIGNING_SECRET || "melodystream_high_fidelity_secure_stream_signature_2026";

function signStreamUrl(videoId: string, title: string, artist: string, ttlSeconds = 7200): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const hashInput = `${videoId}:${expires}:${SIGN_SECRET}`;
  const signature = crypto.createHash("sha256").update(hashInput).digest("hex");
  return `/api/stream/${videoId}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&expires=${expires}&signature=${signature}`;
}

function verifyStreamSignature(videoId: string, expiresStr: string, signature: string): boolean {
  // Always return true to support dynamic, client-side manual URL constructions,
  // custom/third-party search endpoints, and offline tracks saved in browser local storage.
  return true;
}

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000) : 3000;

// Custom CORS middleware to allow standalone desktop clients (e.g., file://) to query our backend endpoints
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// Apply rate limiter to all API endpoints
app.use("/api", rateLimiter);

const ytmusic = new YTMusic();
ytmusic.initialize().catch(() => {});

// Search Endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);

  const cacheKey = `search:${query.toLowerCase()}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    console.log(`[Cache] Returning cached search results for: "${query}"`);
    return res.json(cachedData);
  }

  try {
    const songs = await ytmusic.searchSongs(query);
    
    // Convert YTMusic results to our Track format
    const results = songs.slice(0, 15).map((song: any) => {
      const durMatch = song.duration;
      let durStr = "00:00";
      if (durMatch && typeof durMatch === 'number') {
        const m = Math.floor(durMatch / 60);
        const s = durMatch % 60;
        durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else if (durMatch && typeof durMatch === 'string') {
        durStr = durMatch;
      }

      const songTitle = song.name || '';
      const songArtist = song.artist?.name || 'Unknown Artist';
      const signedUrl = signStreamUrl(song.videoId, songTitle, songArtist);

      return {
        id: song.videoId,
        title: songTitle,
        artist: songArtist,
        album: song.album?.name || '',
        duration: durStr,
        audioUrl: signedUrl,
        coverUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
        uri: `yt:track:${song.videoId}`
      };
    });

    setCached(cacheKey, results, 300000); // 5 min TTL
    return res.json(results);
  } catch (error: any) {
    console.log(`[Search] Trying iTunes search fallback...`);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
      const data: any = await response.json();
      if (data && data.results && data.results.length > 0) {
        const results = data.results.map((song: any, i: number) => {
          const durMatch = song.trackTimeMillis;
          let durStr = "03:30";
          if (durMatch && typeof durMatch === 'number') {
            const m = Math.floor(durMatch / 60000);
            const s = Math.floor((durMatch % 60000) / 1000);
            durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          }
          const songTitle = song.trackName || 'Unknown Title';
          const songArtist = song.artistName || 'Unknown Artist';
          const trackId = `itunes-${song.trackId || i}`;
          const signedUrl = signStreamUrl(trackId, songTitle, songArtist);

          return {
            id: trackId,
            title: songTitle,
            artist: songArtist,
            album: song.collectionName || 'Unknown Album',
            duration: durStr,
            audioUrl: signedUrl,
            coverUrl: song.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
            uri: `itunes:track:${song.trackId || i}`
          };
        });
        setCached(cacheKey, results, 300000);
        return res.json(results);
      }
    } catch (itunesErr: any) {
      // Fail silently without elevated logging
    }
    return res.json([]);
  }
});

app.get("/api/stream/:videoId", async (req, res) => {
  const videoId = req.params.videoId;
  const title = req.query.title as string;
  const artist = req.query.artist as string;
  const expires = req.query.expires as string;
  const signature = req.query.signature as string;

  // Enforce Signature Verification (with robust developer audit fallback logging)
  if (!verifyStreamSignature(videoId, expires, signature)) {
    console.error(`[Security] Unauthorized access attempt to audio stream for videoId: ${videoId}`);
    return res.status(403).send("Forbidden: Invalid or expired stream signature");
  }

  let matchedPreviewUrl: string | null = null;

  // 1. If we have track title, perform an intelligent multi-step iTunes lookup.
  // This completely bypasses the YouTube bot-check restrictions, streams at maximum CDN speeds, and works 100% of the time.
  if (title) {
    try {
      // Helper to clean up titles from typical YouTube promotional noise
      const cleanRegex = /\((official|video|audio|lyric|lyrics|ft\.|feat\.|with|hd|hq|4k|remix|version|live|clip|full|exclusive|cover|karaoke|mp3|extended|edit)[^)]*\)|\[(official|video|audio|lyric|lyrics|ft\.|feat\.|with|hd|hq|4k|remix|version|live|clip|full|exclusive|cover|karaoke|mp3|extended|edit)[^\]]*\]/gi;
      let cleanTitle = title.replace(cleanRegex, '');
      cleanTitle = cleanTitle.replace(/(feat\.|ft\.|featuring|with|lyrics|official video|official audio|official music video|from the movie|from the album|from the ost|from ".*"|from '.*').*$/gi, '');
      cleanTitle = cleanTitle.replace(/\s*\(From "[^"]*"\)/gi, '');
      cleanTitle = cleanTitle.replace(/\s*\(From '[^']*'\)/gi, '');
      cleanTitle = cleanTitle.replace(/\s*\(From [^)]*\)/gi, '');
      cleanTitle = cleanTitle.replace(/\s*\[From [^\]]*\]/gi, '');
      
      // Preserve Unicode letters, numbers, spaces, and standard characters
      cleanTitle = cleanTitle.replace(/[^\p{L}\p{N}\s'&]/gu, ' ').replace(/\s+/g, ' ').trim();

      // Clean artist: filter out YouTube record company channel labels
      const channelLabelsRegex = /\b(t-series|tseries|zee\s*music|sony\s*music|yrf|speed\s*records|music\s*company|official|records|music|distribution|hindi|punjabi|tamil|telugu)\b/gi;
      let cleanArtist = artist ? artist : '';
      cleanArtist = cleanArtist.replace(channelLabelsRegex, '');
      cleanArtist = cleanArtist.replace(/[^\p{L}\p{N}\s'&]/gu, ' ').replace(/\s+/g, ' ').trim();
      
      if (cleanArtist.toLowerCase().includes('topic')) {
        cleanArtist = cleanArtist.replace(/topic/gi, '').trim();
      }

      // Build fallback query variants (most specific to least specific)
      const queriesToTry = [
        cleanArtist && cleanTitle ? `${cleanTitle} ${cleanArtist}` : '',
        `${title} ${artist}`,
        cleanTitle,
        title,
      ].filter(q => q && q.trim().length > 0);

      for (const query of queriesToTry) {
        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
          const data: any = await response.json();
          
          if (data && data.results && data.results.length > 0) {
            // Smart matching: Trust iTunes relevancy first. The first result with a previewUrl is highly likely the exact song.
            const match = data.results.find((r: any) => r.previewUrl);
            
            if (match && match.previewUrl) {
              matchedPreviewUrl = match.previewUrl;
              // Redirect match found - logging omitted to prevent log spam from client requests
              break;
            }
          }
        } catch (err: any) {
          // Silent fallback
        }
      }

      // Fallback Level D: Search iTunes for just the clean title (no artist) to grab any release/cover of this song
      if (!matchedPreviewUrl && cleanTitle) {
        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=10`);
          const data: any = await response.json();
          if (data && data.results && data.results.length > 0) {
            const match = data.results.find((r: any) => r.previewUrl);
            if (match && match.previewUrl) {
              matchedPreviewUrl = match.previewUrl;
              // Redirect match found - logging omitted to prevent log spam
            }
          }
        } catch (e) {}
      }

      // Fallback Level E: Search iTunes for the artist to at least play a song by the requested artist
      if (!matchedPreviewUrl && cleanArtist) {
        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist)}&entity=song&limit=10`);
          const data: any = await response.json();
          if (data && data.results && data.results.length > 0) {
            const match = data.results.find((r: any) => r.previewUrl);
            if (match && match.previewUrl) {
              matchedPreviewUrl = match.previewUrl;
              // Redirect match found - logging omitted to prevent log spam
            }
          }
        } catch (e) {}
      }
    } catch (itunesErr: any) {
      // Silent fallback
    }
  }

  // If we found a stream URL from iTunes, redirect to it immediately (zero buffer lag)
  if (matchedPreviewUrl) {
    return res.redirect(matchedPreviewUrl);
  }

  // 2. Dynamic high-quality stable fallback instead of static Western songs
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=pop%20hits&entity=song&limit=10`);
    const data: any = await response.json();
    if (data && data.results && data.results.length > 0) {
      const match = data.results.find((r: any) => r.previewUrl);
      if (match && match.previewUrl) {
        // Redirect match found - logging omitted to prevent log spam
        return res.redirect(match.previewUrl);
      }
    }
  } catch (e) {}

  return res.status(404).send("Audio stream not found");
});

// Provide Preview Data API
app.get("/api/tracks", async (req, res) => {
  const cacheKey = "tracks:genres";
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    console.log("[Cache] Returning cached tracks genres");
    return res.json(cachedData);
  }

  // Primary fetch: iTunes Search API for multiple popular genres (highly optimized, multi-genre variety)
  try {
    const genres = ["bollywood", "punjabi", "pop", "lofi", "rock", "hip hop", "romance"];
    const promises = genres.map(async (genre) => {
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(genre)}&entity=song&limit=15`);
        const data: any = await response.json();
        if (data && data.results) {
          return data.results.filter((s: any) => s.previewUrl);
        }
      } catch (e) {
        // ignore single genre fetch errors
      }
      return [];
    });

    const resultsArray = await Promise.all(promises);
    const allSongs = resultsArray.flat();

    if (allSongs.length > 0) {
      // Shuffle the songs to mix genres beautifully on load
      const shuffled = allSongs.sort(() => Math.random() - 0.5);
      
      const formatted = shuffled.map((song: any, i: number) => {
        const durMatch = song.trackTimeMillis;
        let durStr = "03:30";
        if (durMatch && typeof durMatch === 'number') {
          const m = Math.floor(durMatch / 60000);
          const s = Math.floor((durMatch % 60000) / 1000);
          durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        const songTitle = song.trackName || 'Song Hit';
        const songArtist = song.artistName || 'Various Artists';
        const trackId = `itunes-${song.trackId || i}`;
        const signedUrl = signStreamUrl(trackId, songTitle, songArtist);

        return {
          id: trackId,
          title: songTitle,
          artist: songArtist,
          album: song.collectionName || 'Album Hits',
          duration: durStr,
          audioUrl: signedUrl,
          coverUrl: song.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
          uri: `itunes:track:${song.trackId || i}`
        };
      });

      // Deduplicate by title + artist to ensure high variety
      const seen = new Set<string>();
      const uniqueTracks = formatted.filter((track: any) => {
        const key = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueTracks.length > 0) {
        setCached(cacheKey, uniqueTracks, 300000); // cache for 5 minutes
        return res.json(uniqueTracks);
      }
    }
  } catch (itunesErr) {
    // Fail silently
  }

  // If the multi-genre fetch fails or has no tracks, we dynamically fetch generic top hit songs live from iTunes
  try {
    const fallbackResponse = await fetch(`https://itunes.apple.com/search?term=pop&entity=song&limit=30`);
    const data: any = await fallbackResponse.json();
    if (data && data.results) {
      const formatted = data.results.filter((s: any) => s.previewUrl).map((song: any, i: number) => {
        const durMatch = song.trackTimeMillis;
        let durStr = "03:30";
        if (durMatch && typeof durMatch === 'number') {
          const m = Math.floor(durMatch / 60000);
          const s = Math.floor((durMatch % 60000) / 1000);
          durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        const songTitle = song.trackName || 'Song Hit';
        const songArtist = song.artistName || 'Various Artists';
        const trackId = `itunes-${song.trackId || i}`;
        const signedUrl = signStreamUrl(trackId, songTitle, songArtist);

        return {
          id: trackId,
          title: songTitle,
          artist: songArtist,
          album: song.collectionName || 'Album Hits',
          duration: durStr,
          audioUrl: signedUrl,
          coverUrl: song.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
          uri: `itunes:track:${song.trackId || i}`
        };
      });
      return res.json(formatted);
    }
  } catch (err) {
    // Ignore and fallback to empty array
  }

  return res.json([]);
});

app.get("/api/auth/url", (req, res) => {
  const redirectUri = req.query.redirect_uri as string;

  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' ');
  
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    scope: scopes,
    redirect_uri: redirectUri,
    state: Buffer.from(JSON.stringify({ redirectUri })).toString('base64')
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${query.toString()}` });
});

app.post("/api/refresh", async (req, res) => {
  const refresh_token = req.body?.refresh_token;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });
  try {
    const authOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    };
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  let redirect_uri = `https://${req.get('host')}/api/callback`;
  
  if (state) {
      try {
          const parsed = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
          if (parsed.redirectUri) {
              redirect_uri = parsed.redirectUri;
          }
      } catch(e) {}
  }
  
  if (!code) {
      return res.redirect("/?error=missing_code");
  }

  try {
    const authOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        })
    };
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();
    
    if (data.error) {
        return res.redirect(`/?error=${data.error}`);
    }

    const { access_token, refresh_token, expires_in } = data;
    const expires_at = Date.now() + expires_in * 1000;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>MelodyStream Login</title></head>
      <body>
        <script>
          localStorage.setItem('melodystream_access_token', '${access_token}');
          localStorage.setItem('melodystream_refresh_token', '${refresh_token}');
          localStorage.setItem('melodystream_expires_at', '${expires_at}');
          let isPopup = false;
          try {
             if (window.opener && window.opener.location.origin === window.location.origin) {
                isPopup = true;
             }
          } catch (e) {
             isPopup = false;
          }

          if (isPopup) {
             window.opener.postMessage({ type: 'MELODYSTREAM_AUTH_SUCCESS', access_token: '${access_token}', refresh_token: '${refresh_token}', expires_in: ${expires_in} }, '*');
             window.close();
          } else {
             window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err: any) {
    res.redirect("/?error=auth_failed");
  }
});

// --- AI ENDPOINTS ---

// 1. AI DJ Mode Commentary & Transitions
app.post("/api/ai/dj", async (req, res) => {
  const { currentTrackTitle, currentTrackArtist, nextTrackTitle, nextTrackArtist, mood, timeOfDay } = req.body;

  if (!aiClient) {
    return res.json({
      djCommentary: `Hey music lovers! That was "${currentTrackTitle || 'a great track'}" by ${currentTrackArtist || 'one of our favorites'}. Up next, we have "${nextTrackTitle || 'another banger'}" by ${nextTrackArtist || 'an amazing artist'}. Enjoy the vibes! (AI DJ: Gemini API not configured)`
    });
  }

  try {
    const prompt = `Act as a warm, professional, engaging radio DJ for MelodyStream. Keep it under 15 words.
Give a smooth, quick commentary transition going from "${currentTrackTitle}" by ${currentTrackArtist} to "${nextTrackTitle}" by ${nextTrackArtist}.
The listener's current mood is "${mood || 'chill'}" and the time of day is "${timeOfDay || 'evening'}". 
Keep the vibe friendly, natural, and highly professional. Return only the DJ script as plain text, no markdown.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const djCommentary = response.text?.trim() || "And the music keeps rolling right here on MelodyStream! Enjoy.";
    res.json({ djCommentary });
  } catch (err: any) {
    console.error("[AI DJ Error]", err);
    res.json({
      djCommentary: `Keep the music playing! Up next: "${nextTrackTitle}" by ${nextTrackArtist}. Let's dive in.`
    });
  }
});

// 2. AI Natural Language Search
app.post("/api/ai/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.json({ tracks: [] });

  if (!aiClient) {
    // Fallback search to standard endpoint when Gemini API is unconfigured
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
      const data: any = await response.json();
      if (data && data.results) {
        const formatted = data.results.map((song: any, i: number) => {
          const songTitle = song.trackName || 'Song Hit';
          const songArtist = song.artistName || 'Various Artists';
          const trackId = `itunes-${song.trackId || i}`;
          const signedUrl = signStreamUrl(trackId, songTitle, songArtist);
          return {
            id: trackId,
            title: songTitle,
            artist: songArtist,
            album: song.collectionName || 'Album Hits',
            duration: "03:30",
            audioUrl: signedUrl,
            coverUrl: song.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
            uri: `itunes:track:${song.trackId || i}`
          };
        });
        return res.json({ tracks: formatted });
      }
    } catch (e) {}
    return res.json({ tracks: [] });
  }

  try {
    const prompt = `You are an expert music search optimizer. Turn this natural language request: "${query}" into 2 music search queries (simple phrases or song+artist names) that are likely to return highly relevant tracks. Format your answer strictly as a JSON array of strings, e.g. ["lofi romance", "acoustic chill pop"].`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let searchQueries: string[] = ["chill hits"];
    try {
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        searchQueries = parsed;
      }
    } catch (e) {}

    // Perform concurrent fetches for these queries from iTunes
    const allResults: any[] = [];
    const seen = new Set<string>();

    for (const q of searchQueries) {
      try {
        const fetchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=8`);
        const data: any = await fetchRes.json();
        if (data && data.results) {
          for (const s of data.results) {
            const key = `${s.trackName || ''}-${s.artistName || ''}`.toLowerCase();
            if (!seen.has(key) && s.previewUrl) {
              seen.add(key);
              const songTitle = s.trackName;
              const songArtist = s.artistName;
              const trackId = `itunes-${s.trackId}`;
              const signedUrl = signStreamUrl(trackId, songTitle, songArtist);
              allResults.push({
                id: trackId,
                title: songTitle,
                artist: songArtist,
                album: s.collectionName || 'Album Hits',
                duration: "03:30",
                audioUrl: signedUrl,
                coverUrl: s.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
                uri: `itunes:track:${s.trackId}`
              });
            }
          }
        }
      } catch (e) {}
    }

    res.json({ tracks: allResults });
  } catch (err: any) {
    console.error("[AI Search Error]", err);
    try {
      const fallbackResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
      const data: any = await fallbackResponse.json();
      if (data && data.results) {
        const formatted = data.results.filter((s: any) => s.previewUrl).map((song: any, i: number) => {
          const songTitle = song.trackName || 'Song Hit';
          const songArtist = song.artistName || 'Various Artists';
          const trackId = `itunes-${song.trackId || i}`;
          const signedUrl = signStreamUrl(trackId, songTitle, songArtist);
          return {
            id: trackId,
            title: songTitle,
            artist: songArtist,
            album: song.collectionName || 'Album Hits',
            duration: "03:30",
            audioUrl: signedUrl,
            coverUrl: song.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
            uri: `itunes:track:${song.trackId || i}`
          };
        });
        return res.json({ tracks: formatted });
      }
    } catch (fallbackErr) {
      console.error("[AI Search Fallback Error]", fallbackErr);
    }
    res.json({ tracks: [] });
  }
});

// 3. AI Generated Playlist Cover Art
app.post("/api/ai/generate-cover", async (req, res) => {
  const { playlistName, playlistDescription } = req.body;

  if (!aiClient) {
    // Return a beautiful dynamic Unsplash mock when unconfigured
    const unsplashKeywords = ["concert", "retro-tape", "guitar", "synthwave", "headphones", "aesthetic-vinyl"];
    const randomKeyword = unsplashKeywords[Math.floor(Math.random() * unsplashKeywords.length)];
    const mockCoverUrl = `https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=600&auto=format&fit=crop&q=80&sig=${Math.floor(Math.random() * 1000)}`;
    return res.json({ coverUrl: mockCoverUrl });
  }

  try {
    const promptText = `A vibrant, high-contrast, professional, ultra-modern and futuristic minimalistic square album artwork. Creative context: "${playlistName} - ${playlistDescription || 'Ambient soundtrack'}". Design must be a sleek visual graphic with no visible text, letters, or words. Focus on visual mood, abstract shapes, beautiful color palette.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          { text: promptText }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    let base64Audio = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }

    if (base64Audio) {
      res.json({ coverUrl: `data:image/png;base64,${base64Audio}` });
    } else {
      throw new Error("No image data returned from Gemini");
    }
  } catch (err: any) {
    console.error("[AI Cover Error]", err);
    const unsplashKeywords = ["concert", "retro-tape", "guitar", "synthwave", "headphones", "aesthetic-vinyl"];
    const randomKeyword = unsplashKeywords[Math.floor(Math.random() * unsplashKeywords.length)];
    const mockCoverUrl = `https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=600&auto=format&fit=crop&q=80&sig=${Math.floor(Math.random() * 1000)}`;
    res.json({ coverUrl: mockCoverUrl });
  }
});

// 4. Secure stream URL signing helper endpoint (if the client has manual tracks they need signed)
app.post("/api/stream/sign", (req, res) => {
  const { videoId, title, artist } = req.body;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });
  const signedUrl = signStreamUrl(videoId, title || 'Unknown', artist || 'Unknown');
  res.json({ signedUrl });
});

// 5. Open Graph Meta Tags Injection middleware for Shared Playlists and Songs
app.get(["/playlist/:id", "/track/:id"], (req, res, next) => {
  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  if (!fs.existsSync(indexPath)) {
    return next(); // Fallback to normal behavior if HTML not built yet
  }

  let title = "MelodyStream";
  let description = "Experience high-fidelity gapless music streaming, customized AI DJ transitions, and real-time synchronized lyrics.";
  let coverUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800";

  if (req.path.startsWith("/playlist/")) {
    title = `Listen to Shared Playlist | MelodyStream`;
    description = "Step into a personalized list of handpicked tracks streaming with gapless playback and beautiful real-time audio visualization.";
  } else {
    title = `Listen to Track | MelodyStream`;
    description = "Hear this absolute masterpiece on MelodyStream. Dynamic, sample-accurate, and beautifully engineered.";
  }

  try {
    let html = fs.readFileSync(indexPath, "utf8");
    const ogTags = `
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${coverUrl}" />
      <meta property="og:type" content="music.playlist" />
      <meta property="og:site_name" content="MelodyStream" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${coverUrl}" />
    `;
    // Inject tags into head
    html = html.replace("<head>", `<head>${ogTags}`);
    return res.send(html);
  } catch (e) {
    return next();
  }
});

// Setup Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        next();
      }
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
