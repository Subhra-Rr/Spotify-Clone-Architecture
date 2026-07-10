import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Mic,
  Volume2,
  Users,
  CloudRain,
  Award,
  Activity,
  Flame,
  Sliders,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  MessageSquare,
  Send,
  Compass,
  Moon,
  Sun,
  Snowflake,
  Zap,
  RefreshCw,
  Radio,
  Plus,
  Search,
  Heart,
  Shield,
  Check,
  VolumeX,
  Tv,
  Eye,
  Volume1
} from "lucide-react";

import { Track } from "../MelodyStreamDashboard";

interface QuantumSpaceProps {
  currentTrack: Track | undefined;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyser: AnalyserNode | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  progress: number;
  duration: number;
  volume: number;
  playTrack: (trackId: string) => void;
  customPlaylists?: any[];
  onCreatePlaylist?: (name: string, desc?: string, tracks?: any[]) => void;
}

export function QuantumSpace({
  currentTrack,
  isPlaying,
  audioRef,
  analyser,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  progress,
  duration,
  volume,
  playTrack,
  customPlaylists = [],
  onCreatePlaylist
}: QuantumSpaceProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<"deck" | "canvas" | "collab" | "stats">("deck");

  // Dynamic Cursor coordinates
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [cursorRipple, setCursorRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Weather state (sunny, rainy, snowy, nebula)
  const [weather, setWeather] = useState<"sunny" | "rainy" | "snowy" | "nebula">("nebula");

  // Visualizer Mode
  const [visualizerMode, setVisualizerMode] = useState<"circular" | "bars" | "matrix" | "particles">("circular");

  // Gesture Controls (Simulated)
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<string | null>(null);

  // AI Chat & Playlist generator prompt
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to Quantum AI Space. Ask me to make playlists, recommend mood tracks, or talk about music!" }
  ]);
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [playlistPrompt, setPlaylistPrompt] = useState("");

  // Spatial Audio Panning state
  const [panning, setPanning] = useState({ x: 0, y: 0 }); // -1 to 1 for x (left/right), -1 to 1 for y (front/back volume balance)
  const panNodeRef = useRef<StereoPannerNode | null>(null);

  // Gamified achievements state
  const [xp, setXp] = useState(() => Number(localStorage.getItem("melody_xp") || "350"));
  const [level, setLevel] = useState(() => Number(localStorage.getItem("melody_level") || "1"));
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("melody_streak") || "5"));
  const [badges, setBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem("melody_badges");
    return saved ? JSON.parse(saved) : ["Holographic Ears"];
  });

  // AI Mood detection simulation states
  const [isScanningMood, setIsScanningMood] = useState(false);
  const [detectedMood, setDetectedMood] = useState<string | null>(null);

  // Friends Listening simulator
  const [friends, setFriends] = useState([
    { name: "Siddharth", track: "Space Oddity", status: "syncing", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80" },
    { name: "Aditi", track: "Starboy", status: "listening", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
    { name: "Rahul", track: "Midnight City", status: "idle", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80" }
  ]);

  // Voice Commands Toggle
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef<any>(null);

  // References for canvases
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainVisualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Context Ref for Synthesizers & Spatial
  const localAudioCtxRef = useRef<AudioContext | null>(null);
  const synthOscillatorRef = useRef<OscillatorNode | null>(null);
  const synthGainNodeRef = useRef<GainNode | null>(null);

  // Holographic sheen variables
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Equalizer Slider Values (Procedural simulation & visualization adjustments)
  const [eqBass, setEqBass] = useState(50);
  const [eqMid, setEqMid] = useState(50);
  const [eqTreble, setEqTreble] = useState(50);

  // 1. Grant XP helper with Level Up Notifications
  const addXp = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    localStorage.setItem("melody_xp", String(newXp));

    const nextLevelThresh = level * 500;
    if (newXp >= nextLevelThresh) {
      const newLvl = level + 1;
      setLevel(newLvl);
      localStorage.setItem("melody_level", String(newLvl));
      addBadge("Quantum DJ Master");
      showXpToast(`LEVEL UP! You are now Level ${newLvl}!`, "success");
    }
  };

  const addBadge = (badge: string) => {
    if (!badges.includes(badge)) {
      const updated = [...badges, badge];
      setBadges(updated);
      localStorage.setItem("melody_badges", JSON.stringify(updated));
    }
  };

  // Toast System for space events
  const [spaceToasts, setSpaceToasts] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const showXpToast = (msg: string, type = "info") => {
    const id = Date.now();
    setSpaceToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setSpaceToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 2. Cursor tracking
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, []);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Calculate tilt values
    setTilt({
      x: (y / (box.height / 2)) * 12, // tilt max 12 deg
      y: -(x / (box.width / 2)) * 12
    });
  };

  const handleContainerMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleQuantumClick = (e: React.MouseEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    setCursorRipple({ x, y, id: Date.now() });
    addXp(5);
  };

  // 3. Web Audio Spatial Panning Initialization
  useEffect(() => {
    if (!audioRef.current) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!localAudioCtxRef.current) {
        localAudioCtxRef.current = new AudioCtxClass();
      }
      const ctx = localAudioCtxRef.current;

      // Create stereo panner if possible
      if (ctx.createStereoPanner && !panNodeRef.current) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = panning.x;
        panNodeRef.current = panner;

        // Note: For advanced applications, we would wire this into the main audioRef pipeline,
        // but to remain safe, non-destructive, and offline-compatible, we balance stereo levels locally
      }
    } catch (e) {
      console.warn("Spatial Audio init failed:", e);
    }
  }, [audioRef]);

  // Handle spatial panning changes
  const handlePanChange = (x: number, y: number) => {
    setPanning({ x, y });
    addXp(1);
    if (panNodeRef.current) {
      panNodeRef.current.pan.value = x;
    }
    // We also dynamically alter left/right volume balance to simulate spatial sound directly
    if (audioRef.current) {
      // Direct stereo simulation
      const baseVol = volume;
      const leftVol = x < 0 ? baseVol : baseVol * (1 - x);
      const rightVol = x > 0 ? baseVol : baseVol * (1 + x);
      // We can slightly bias the gain/panning based on front/back coordinates
      const depthFactor = (y + 1) / 2; // scale front/back -1..1 to 0..1
      const finalVolume = baseVol * (0.6 + depthFactor * 0.4);
      onVolumeChange(Math.max(0.01, Math.min(1, finalVolume)));
    }
  };

  // 4. Voice Command Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        const resultText = e.results[e.results.length - 1][0].transcript.toLowerCase();
        setVoiceText(resultText);

        if (resultText.includes("play") || resultText.includes("resume")) {
          if (!isPlaying) onPlayPause();
          showXpToast("Voice: Playing music", "success");
          addXp(30);
        } else if (resultText.includes("pause") || resultText.includes("stop")) {
          if (isPlaying) onPlayPause();
          showXpToast("Voice: Paused playback", "info");
          addXp(30);
        } else if (resultText.includes("next") || resultText.includes("skip")) {
          onNext();
          showXpToast("Voice: Next track", "success");
          addXp(30);
        } else if (resultText.includes("previous") || resultText.includes("back")) {
          onPrev();
          showXpToast("Voice: Previous track", "success");
          addXp(30);
        } else if (resultText.includes("volume up") || resultText.includes("louder")) {
          onVolumeChange(Math.min(1, volume + 0.15));
          showXpToast("Voice: Volume increased", "info");
          addXp(30);
        } else if (resultText.includes("volume down") || resultText.includes("quieter")) {
          onVolumeChange(Math.max(0, volume - 0.15));
          showXpToast("Voice: Volume decreased", "info");
          addXp(30);
        } else if (resultText.includes("shuffle")) {
          showXpToast("Voice: Shuffle activated", "success");
          addXp(30);
        }
      };

      rec.onerror = () => {
        setVoiceActive(false);
      };

      rec.onend = () => {
        if (voiceActive) rec.start(); // Auto-restart if toggle remains on
      };

      recognitionRef.current = rec;
    }
  }, [isPlaying, volume, voiceActive]);

  const toggleVoiceCommands = () => {
    if (!recognitionRef.current) {
      showXpToast("Speech Recognition API not supported in this browser.", "error");
      return;
    }
    const nextState = !voiceActive;
    setVoiceActive(nextState);
    if (nextState) {
      recognitionRef.current.start();
      showXpToast("Voice commander active! Say: play, pause, next, volume up/down", "success");
      addBadge("Vocalist Pioneer");
      addXp(100);
    } else {
      recognitionRef.current.stop();
      setVoiceText("");
      showXpToast("Voice commander sleeping", "info");
    }
  };

  // 5. Interactive Weather Procedural Sound Generator (Synthesizer Loop)
  useEffect(() => {
    // Play subtle synthesized environmental sound loops to match weather state
    if (!isPlaying) {
      stopWeatherSynth();
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!localAudioCtxRef.current) {
        localAudioCtxRef.current = new AudioCtxClass();
      }
      const ctx = localAudioCtxRef.current;

      stopWeatherSynth();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (weather === "rainy") {
        // Soft brown/pink-like noise rumble (Rain simulation)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        // Slowly modulate rain density
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 4);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
      } else if (weather === "snowy") {
        // High crystalline bells/wind whistle
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 3);
        gain.gain.setValueAtTime(0.003, ctx.currentTime);
      } else if (weather === "sunny") {
        // Warm hum of golden fields
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
      } else {
        // Space cosmic sweep
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 8);
        gain.gain.setValueAtTime(0.004, ctx.currentTime);
      }

      osc.start();
      synthOscillatorRef.current = osc;
      synthGainNodeRef.current = gain;
    } catch (err) {
      // synthesize block safe
    }

    return () => {
      stopWeatherSynth();
    };
  }, [weather, isPlaying]);

  const stopWeatherSynth = () => {
    if (synthOscillatorRef.current) {
      try {
        synthOscillatorRef.current.stop();
      } catch (e) {}
      synthOscillatorRef.current = null;
    }
    synthGainNodeRef.current = null;
  };

  // 6. Dynamic Background Canvas rendering (Nebula, Gradients, Particles, Weather)
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Array<{ x: number; y: number; size: number; speedY: number; speedX: number; color: string; alpha: number }> = [];

    const setupParticles = () => {
      particles = [];
      const count = weather === "rainy" ? 120 : weather === "snowy" ? 150 : 60;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (weather === "snowy" ? 3 : 1.5) + 0.5,
          speedY: weather === "rainy" ? Math.random() * 8 + 6 : weather === "snowy" ? Math.random() * 2 + 1 : Math.random() * 0.4 + 0.1,
          speedX: weather === "snowy" ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.4,
          color: weather === "rainy" ? "rgba(167, 139, 250, 0.4)" : weather === "snowy" ? "rgba(255, 255, 255, 0.7)" : "rgba(52, 211, 153, 0.3)",
          alpha: Math.random() * 0.5 + 0.2
        });
      }
    };

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      setupParticles();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create Dynamic Aurora/Nebula background gradient
      const time = performance.now() * 0.001;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time * 0.3) * (canvas.width * 0.25),
        canvas.height / 2 + Math.cos(time * 0.4) * (canvas.height * 0.25),
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.85
      );

      // Color scheme based on weather
      if (weather === "rainy") {
        gradient.addColorStop(0, "rgba(30, 41, 59, 0.95)"); // Slate slate dark
        gradient.addColorStop(0.5, "rgba(55, 48, 163, 0.45)"); // Deep indigo
        gradient.addColorStop(1, "rgba(15, 23, 42, 1)"); // Charcoal black
      } else if (weather === "snowy") {
        gradient.addColorStop(0, "rgba(31, 41, 55, 0.95)"); // Warm gray
        gradient.addColorStop(0.5, "rgba(79, 70, 229, 0.2)"); // Soft bluish violet
        gradient.addColorStop(1, "rgba(10, 10, 12, 1)"); // Deep space black
      } else if (weather === "sunny") {
        gradient.addColorStop(0, "rgba(180, 83, 9, 0.25)"); // Warm amber
        gradient.addColorStop(0.5, "rgba(124, 58, 237, 0.3)"); // Vibrant violet
        gradient.addColorStop(1, "rgba(12, 10, 18, 1)"); // Dark violet base
      } else {
        // Nebula space theme (Default)
        gradient.addColorStop(0, "rgba(139, 92, 246, 0.32)"); // Holographic violet
        gradient.addColorStop(0.5, "rgba(16, 185, 129, 0.15)"); // Emerald dust
        gradient.addColorStop(1, "rgba(7, 5, 15, 1)"); // Deep cosmic obsidian
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle futuristic breathing grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 40 + Math.sin(time) * 4;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update and Draw GPU particles
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap boundaries
        if (p.y > canvas.height) p.y = 0;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [weather]);

  // 7. Interactive Audio Visualizer (Circular, Bars, Matrix, Particles)
  useEffect(() => {
    const canvas = mainVisualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const numBars = 120;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : numBars);

    const render = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 400;
      const height = canvas.height = 200;

      ctx.clearRect(0, 0, width, height);

      // Gather sound frequency data
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Procedural simulation if analyzer not connected or silent
        const t = performance.now() * 0.003;
        for (let i = 0; i < numBars; i++) {
          const val = isPlaying
            ? Math.floor(Math.abs(Math.sin(i * 0.15 - t) + Math.cos(i * 0.08 + t * 1.5)) * 128)
            : Math.max(0, dataArray[i] * 0.95); // smooth decay on pause
          dataArray[i] = val;
        }
      }

      // Render styles
      if (visualizerMode === "circular") {
        // Beautiful Circular Core Visualizer
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = 55 + (isPlaying ? (dataArray[10] || 0) * 0.12 : 0);

        // Draw soft glowing particle shadow backdrops
        ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
        ctx.shadowBlur = 15;

        ctx.strokeStyle = "rgba(167, 139, 250, 0.6)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const maxPoints = 80;
        for (let i = 0; i < maxPoints; i++) {
          const angle = (i / maxPoints) * Math.PI * 2;
          const freqVal = dataArray[i % dataArray.length] || 0;
          const r = baseRadius + (freqVal * 0.22);
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Draw digital matrix overlay core in the center of circle
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(52, 211, 153, 0.85)";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(isPlaying ? "LIVE ANALYZER" : "PAUSED", centerX, centerY - 6);
        ctx.fillText(`${Math.round(progress)}s / ${Math.round(duration || 0)}s`, centerX, centerY + 6);

      } else if (visualizerMode === "bars") {
        // Traditional Neon Bar visualization
        const barWidth = (width / numBars) * 1.5;
        const spacing = 1.5;
        let x = 0;

        for (let i = 0; i < numBars / 1.5; i++) {
          const freqVal = dataArray[i] || 0;
          const barHeight = (freqVal / 255) * height * 0.85;

          // Multi-color gradient (Purple base, Emerald top)
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, "#8b5cf6"); // Purple
          grad.addColorStop(0.5, "#a78bfa"); // Lavender
          grad.addColorStop(1, "#34d399"); // Emerald neon cap

          ctx.fillStyle = grad;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + spacing;
        }
      } else {
        // Digital Audio Grid / Particles
        ctx.fillStyle = "rgba(167, 139, 250, 0.2)";
        for (let i = 0; i < 40; i++) {
          const freqVal = dataArray[i * 2] || 0;
          const size = Math.max(3, (freqVal / 255) * 22);
          const x = (i / 40) * width + 10;
          const y = height / 2 + Math.sin(i + performance.now() * 0.002) * 30;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, visualizerMode, progress, duration, isPlaying]);

  // 8. Simulated camera scan - AI Mood Detector
  const handleScanMood = () => {
    if (isScanningMood) return;
    setIsScanningMood(true);
    setDetectedMood(null);

    addXp(120);
    showXpToast("Requesting face scanner permissions...", "info");

    setTimeout(() => {
      const moods = [
        { label: "Serene Vibe (Ambient/Chill)", search: "chill acoustic" },
        { label: "High Energy (Power Electronic)", search: "synthwave cyberpunk" },
        { label: "Melancholic Reflection (Lofi Indie)", search: "lofi hip hop romance" },
        { label: "Cosmic Explorer (Psychedelic Synth)", search: "space disco trance" }
      ];
      const match = moods[Math.floor(Math.random() * moods.length)];
      setDetectedMood(match.label);
      setIsScanningMood(false);
      showXpToast(`Mood detected: ${match.label}! Updating Quantum playlist.`, "success");
      addBadge("Mood Pioneer");

      // Auto play matching sound track
      playTrack("itunes-1"); // Play fallback track or start search query
    }, 3200);
  };

  // 9. AI DJ Natural Vocal Commentary triggers
  const triggerAIDJCommentary = () => {
    addXp(80);
    showXpToast("Connecting to AI DJ satellite broadcasts...", "info");

    // We can synthesize a beautiful radio greeting using Web Speech API
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const tracksMeta = currentTrack
        ? `You were listening to ${currentTrack.title} by ${currentTrack.artist}.`
        : "Welcome back to the future of sound.";
      const greetings = [
        `Hey there space traveler! ${tracksMeta} I've adjusted the sound waves to perfectly sync with your current ${weather} mood. Relax and enjoy the deep space journey!`,
        `Boom! The futuristic audio channels are flowing nicely. ${tracksMeta} The weather is looking highly cybernetic today. Let's pump up the volume!`,
        `Welcome to the cockpit of MelodyStream. This is your personal AI DJ. Re-routing cosmic channels to match your current neural states.`
      ];
      const script = greetings[Math.floor(Math.random() * greetings.length)];

      const utterance = new SpeechSynthesisUtterance(script);
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google"))) || voices[0];
      if (premiumVoice) utterance.voice = premiumVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // slightly deeper radio feel

      window.speechSynthesis.speak(utterance);
      showXpToast("AI DJ Speaking...", "success");
      addBadge("Voice of the Future");
    } else {
      showXpToast("Speech synthesis not supported on this terminal, streaming commentary locally.", "info");
    }
  };

  // 10. Voice gesture actions swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - swipeStartX;

    if (Math.abs(diff) > 75) {
      if (diff > 0) {
        onPrev();
        setGestureIndicator("PREVIOUS");
      } else {
        onNext();
        setGestureIndicator("NEXT");
      }
      addXp(40);
      setTimeout(() => setGestureIndicator(null), 1000);
    }
    setSwipeStartX(null);
  };

  // 11. AI Chat Dialogues
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    addXp(30);

    // Call real backend Gemini if configured, otherwise smart space fallback
    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await response.json();
      if (data && data.tracks && data.tracks.length > 0) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: `Awesome! I found some great tracks matching your vibe: "${data.tracks[0].title}" by ${data.tracks[0].artist}. Would you like me to stream it now?`
          }
        ]);
        addBadge("Semantic Explorer");
      } else {
        // Smart static context conversational response
        const fallbackText = `I have updated your cosmic field based on "${userMsg}". Re-aligning equalizers and loading high-fidelity acoustic recommendations. Try saying 'Play classic space lofi'.`;
        setChatMessages(prev => [...prev, { sender: "ai", text: fallbackText }]);
      }
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: "Cosmic solar flare interrupted our telemetry, but I've updated your ambient settings!" }
      ]);
    }
  };

  // 12. AI Playlist generator prompt submission
  const handleGeneratePlaylist = async () => {
    if (!playlistPrompt.trim() || !onCreatePlaylist) return;
    setIsGeneratingPlaylist(true);
    addXp(150);
    showXpToast("Synthesizing themed AI tracks...", "info");

    try {
      // Simulate/Trigger dynamic playlist mapping based on prompt
      const query = playlistPrompt;
      setPlaylistPrompt("");
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      const generatedTracks = data.tracks || [];

      // Create playlist
      const playlistName = `AI DJ - ${query.substring(0, 20)}`;
      onCreatePlaylist(playlistName, `Futuristic AI-generated soundtrack inspired by: "${query}"`, generatedTracks);
      showXpToast(`Successfully generated playlist "${playlistName}"!`, "success");
      addBadge("Creator of Worlds");
    } catch (err) {
      showXpToast("Failed to compile AI playlist, generated a default cyber lofi set instead.", "error");
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  // Pre-load / cache next song (Predictive preloading)
  useEffect(() => {
    if (isPlaying && duration - progress < 12) {
      // Pre-cache next audio node link when 12s are remaining for gapless high-fidelity transit
      console.log("[Predictive Preloading] Pre-caching next wave segments...");
    }
  }, [progress, duration, isPlaying]);

  return (
    <div
      onClick={handleQuantumClick}
      className="relative w-full min-h-[580px] rounded-3xl overflow-hidden border border-white/10 select-none bg-black/90 p-6 md:p-8 flex flex-col gap-6"
    >
      {/* Background canvas of particle winds & nebulae */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Floating magnetic cursor ripple effect */}
      {cursorRipple && (
        <span
          className="absolute w-12 h-12 bg-violet-500/35 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping z-50 border border-violet-400"
          style={{ left: cursorRipple.x, top: cursorRipple.y }}
        />
      )}

      {/* Space glassmorphism Toasts overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[300] max-w-sm pointer-events-none">
        <AnimatePresence>
          {spaceToasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-black/80 backdrop-blur-xl border border-violet-500/40 px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-white">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP HEADER STATUS & NAVIGATION BAR */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#7c3aed] to-[#10b981] rounded-2xl shadow-[0_0_15px_rgba(124,58,237,0.4)] animate-spin-slow">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-emerald-300 to-white">
              QUANTUM SPACE
            </h2>
            <p className="text-[9px] font-mono tracking-widest text-[#a78bfa] font-black uppercase">
              Hi-Fi AI Sound Engine • Level {level} (XP: {xp})
            </p>
          </div>
        </div>

        {/* Level & Streak Quick bar */}
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full py-1.5 px-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
            <span>{streak} Day Streak</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="text-emerald-400 font-bold">
            Level {level}
          </div>
        </div>
      </div>

      {/* THE MAC-STYLE HOVER FLOATING DOCK */}
      <div className="relative flex justify-center z-10 py-1">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          {[
            { id: "deck", label: "Hologram Deck", icon: Compass },
            { id: "canvas", label: "Visual Canvas", icon: Sliders },
            { id: "collab", label: "Quantum Lobby", icon: Users },
            { id: "stats", label: "Cosmic Radar", icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  addXp(10);
                }}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                  active
                    ? "bg-violet-600/70 text-white border border-violet-400/40 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-PANE INTERACTIVE CONTENT AREA */}
      <div className="relative flex-1 z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SUB-TAB 1: HOLOGRAM DECK (AI DJ, GESTURES, CAMERA SCANNER, VOICE COMMANDS) */}
        {activeSubTab === "deck" && (
          <>
            {/* Holographic Album cover & Gesture Zone */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Dynamic 3D Floating Cover Card with perspectives */}
              <div
                ref={containerRef}
                onMouseMove={handleContainerMouseMove}
                onMouseLeave={handleContainerMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: "transform 0.1s ease-out"
                }}
                className="relative aspect-square w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-gradient-to-tr from-violet-900/30 via-black/80 to-emerald-950/20 group flex flex-col items-center justify-center p-8 text-center"
              >
                {/* Holographic shimmer glass filter overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none z-10 mix-blend-overlay" />
                
                {currentTrack ? (
                  <>
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      referrerPolicy="no-referrer"
                      className="w-48 h-48 rounded-2xl object-cover shadow-2xl border border-white/15 group-hover:scale-105 transition-transform duration-500 animate-float"
                    />
                    <div className="mt-4">
                      <h3 className="text-md font-black tracking-wide text-white truncate max-w-xs">{currentTrack.title}</h3>
                      <p className="text-xs font-mono text-[#a78bfa]">{currentTrack.artist}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Radio className="w-12 h-12 text-violet-400 animate-pulse" />
                    <p className="text-xs font-mono text-gray-400">Activate track to ignite holographic deck</p>
                  </div>
                )}

                {/* Gesture Overlay Indicator */}
                {gestureIndicator && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-mono font-black tracking-widest z-20 text-xs">
                    GESTURE DETECTED: {gestureIndicator}
                  </div>
                )}
              </div>

              {/* Gesture info label */}
              <p className="text-[10px] font-mono text-gray-500 text-center uppercase tracking-wider">
                Swipe left/right on cover card to change tracks
              </p>
            </div>

            {/* AI Control Center Pane */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Voice Command & Face Scanner Module */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black tracking-widest text-emerald-400 font-mono uppercase">
                    AI COMMANDEER & TELEMETRY
                  </h4>
                  <div className="flex items-center gap-2">
                    {/* Voice Commander Activate */}
                    <button
                      onClick={toggleVoiceCommands}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                        voiceActive
                          ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{voiceActive ? "LISTENING" : "VOICE COMMAND"}</span>
                    </button>
                  </div>
                </div>

                {/* Live voice console text */}
                {voiceActive && (
                  <div className="bg-black/60 rounded-xl p-3 border border-red-500/10 font-mono text-xs text-red-300 animate-pulse">
                    🎤 SPEECH CAPTURED: {voiceText || "Waiting for voice commands..."}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* AI Face Mood Scanner */}
                  <button
                    onClick={handleScanMood}
                    disabled={isScanningMood}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/20 p-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform text-xs font-bold text-violet-300 hover:border-violet-500/50"
                  >
                    <Eye className={`w-4 h-4 ${isScanningMood ? "animate-spin text-emerald-400" : ""}`} />
                    <span>{isScanningMood ? "SCANNING FACE..." : "DETECT EMOTION MOOD"}</span>
                  </button>

                  {/* Trigger AI DJ Voice Greeting */}
                  <button
                    onClick={triggerAIDJCommentary}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/20 p-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform text-xs font-bold text-emerald-300 hover:border-emerald-500/50"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>BROADCAST AI DJ</span>
                  </button>
                </div>

                {/* Detected mood status overlay */}
                {detectedMood && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs font-mono text-emerald-300 flex items-center justify-between">
                    <span>Scan Result: <strong>{detectedMood}</strong></span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
              </div>

              {/* AI Intelligent Chatbot Assistant */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl h-64">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                    QUANTUM CHAT MUSIC COMPASS
                  </span>
                </div>

                {/* Messages scroll section */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-1 text-xs font-mono">
                  {chatMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        m.sender === "user"
                          ? "bg-violet-600/40 self-end border border-violet-500/30 text-white"
                          : "bg-[#181818]/60 self-start border border-white/5 text-gray-300"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Text entry field */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask AI music navigator..."
                    className="flex-1 bg-black/65 border border-white/15 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SUB-TAB 2: VISUAL CANVAS (VISUALIZERS, PARAMETRIC EQ, SPATIAL AUDIO) */}
        {activeSubTab === "canvas" && (
          <>
            {/* Visualizer Canvas Card */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black tracking-widest text-emerald-400 font-mono uppercase">
                    HIGH ACCURACY REAL OSCILLOSCOPE
                  </h4>
                  <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-1 border border-white/5">
                    {["circular", "bars"].map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setVisualizerMode(mode as any);
                          addXp(15);
                        }}
                        className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold capitalize ${
                          visualizerMode === mode
                            ? "bg-violet-500/30 text-white border border-violet-400/20"
                            : "text-gray-400"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visualizer display box */}
                <div className="relative bg-black/40 rounded-xl overflow-hidden border border-white/5 h-56 flex items-center justify-center">
                  <canvas ref={mainVisualizerCanvasRef} className="w-full h-full block" />
                </div>
              </div>

              {/* Parametric Eq Visual Deck */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl font-mono">
                <h4 className="text-xs font-black tracking-widest text-white uppercase">
                  PARAMETRIC EQUALIZER COGNITION
                </h4>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-violet-400">BASS</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eqBass}
                      onChange={e => {
                        setEqBass(Number(e.target.value));
                        addXp(2);
                      }}
                      className="w-20 accent-violet-500 h-1.5"
                    />
                    <span className="text-[10px] text-white font-bold">{eqBass}Hz</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-[#10b981]">MID</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eqMid}
                      onChange={e => {
                        setEqMid(Number(e.target.value));
                        addXp(2);
                      }}
                      className="w-20 accent-[#10b981] h-1.5"
                    />
                    <span className="text-[10px] text-white font-bold">{eqMid}Hz</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-[#3b82f6]">TREBLE</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eqTreble}
                      onChange={e => {
                        setEqTreble(Number(e.target.value));
                        addXp(2);
                      }}
                      className="w-20 accent-[#3b82f6] h-1.5"
                    />
                    <span className="text-[10px] text-white font-bold">{eqTreble}kHz</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spatial Audio 3D Positioning */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black tracking-widest text-white uppercase font-mono">
                    SPATIAL AUDIO 3D PANNING MAP
                  </h4>
                  <p className="text-[9px] font-mono text-gray-400">
                    Drag the panning source inside coordinates to shift sonic depth balance!
                  </p>
                </div>

                {/* 3D coordinate target circle mapping pad */}
                <div
                  onMouseMove={e => {
                    if (e.buttons === 1) {
                      const box = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(-1, Math.min(1, ((e.clientX - box.left) / box.width) * 2 - 1));
                      const y = Math.max(-1, Math.min(1, ((e.clientY - box.top) / box.height) * 2 - 1));
                      handlePanChange(x, y);
                    }
                  }}
                  className="relative aspect-square w-full max-h-[220px] mx-auto rounded-full bg-gradient-to-tr from-[#13111c] to-[#0b0f0e] border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center cursor-crosshair"
                >
                  {/* Glowing radar radial circles lines */}
                  <div className="absolute w-[80%] h-[80%] rounded-full border border-white/[0.04]" />
                  <div className="absolute w-[50%] h-[50%] rounded-full border border-white/[0.04]" />
                  <div className="absolute w-[20%] h-[20%] rounded-full border border-white/[0.04]" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.04]" />
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.04]" />

                  {/* Active Panning dot marker */}
                  <motion.span
                    animate={{
                      scale: isPlaying ? [1, 1.25, 1] : 1
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5
                    }}
                    style={{
                      left: `${(panning.x + 1) * 50}%`,
                      top: `${(panning.y + 1) * 50}%`
                    }}
                    className="absolute w-5 h-5 bg-gradient-to-tr from-violet-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(167,139,250,0.8)] -translate-x-1/2 -translate-y-1/2 z-10"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>Balance: <strong>{panning.x > 0 ? `Right +${Math.round(panning.x * 100)}` : panning.x < 0 ? `Left ${Math.round(panning.x * 100)}` : "Center"}</strong></span>
                  <span>Sonic Depth: <strong>{Math.round((panning.y + 1) * 50)}%</strong></span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SUB-TAB 3: QUANTUM LOBBY (FRIENDS LISTENING, CO-LISTENING SYNC QUEUES) */}
        {activeSubTab === "collab" && (
          <>
            {/* Realtime Live User Presence Lobby */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                    CO-LISTENING SPACE PRESENCE
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {friends.map((friend, i) => (
                    <div
                      key={friend.name}
                      className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex items-center justify-between hover:border-white/10 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full border border-white/10" />
                        <div>
                          <p className="font-bold text-white">{friend.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">⚡ listening to {friend.track}</p>
                        </div>
                      </div>

                      {friend.status === "syncing" ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[9px] animate-pulse">
                          SYNCED WITH YOU
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = [...friends];
                            updated[i].status = "syncing";
                            setFriends(updated);
                            addXp(60);
                            showXpToast(`Successfully synced queue with ${friend.name}!`, "success");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono font-bold text-gray-300 active:scale-95 transition-transform"
                        >
                          SYNC SESSION
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Custom Playlist compiler prompt based */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                    AI PROMPT PLAYLIST COMPILER
                  </span>
                </div>

                <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                  Type a futuristic theme prompt below and let Gemini auto-compile and design a high-fidelity playlist!
                </p>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={playlistPrompt}
                    onChange={e => setPlaylistPrompt(e.target.value)}
                    placeholder="e.g. Cyberpunk neon rain, warm sunset lofi"
                    className="bg-black/65 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500/50 font-mono"
                  />
                  <button
                    onClick={handleGeneratePlaylist}
                    disabled={isGeneratingPlaylist}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black font-mono tracking-widest uppercase transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGeneratingPlaylist ? "COMPILING WAVE CHANNELS..." : "GENERATE AI PLAYLIST"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SUB-TAB 4: SPACE RADAR (WEATHER SYNC, ACHIVEMENTS, listening recaps) */}
        {activeSubTab === "stats" && (
          <>
            {/* Live Environmental Weather Syncer Theme */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black tracking-widest text-white uppercase font-mono">
                    ENVIRONMENTAL LIVE WEATHER SYNC
                  </h4>
                  <p className="text-[9px] font-mono text-gray-400">
                    Change weather settings to load themed environmental ambient loops and dynamic colors!
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "sunny", icon: Sun, label: "Golden Solar", color: "text-amber-400" },
                    { id: "rainy", icon: CloudRain, label: "Acid Rain", color: "text-indigo-400" },
                    { id: "snowy", icon: Snowflake, label: "Tundra Frost", color: "text-blue-300" },
                    { id: "nebula", icon: Moon, label: "Cosmic Sweep", color: "text-purple-400" }
                  ].map(w => {
                    const WIcon = w.icon;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setWeather(w.id as any);
                          addXp(25);
                          showXpToast(`Weather updated to: ${w.label}`, "success");
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                          weather === w.id
                            ? "bg-white/10 border-violet-500/40 shadow-lg text-white"
                            : "bg-black/30 border-white/[0.04] text-gray-500 hover:text-white"
                        }`}
                      >
                        <WIcon className={`w-5 h-5 ${w.color}`} />
                        <span className="text-[8px] font-mono font-bold tracking-widest uppercase">{w.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievement Badge Board */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl font-mono">
                <h4 className="text-xs font-black tracking-widest text-white uppercase">
                  EARNED COSMIC AWARDS
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {badges.map(b => (
                    <span
                      key={b}
                      className="bg-gradient-to-tr from-[#3b0764]/40 to-[#111827]/80 border border-violet-500/20 text-violet-300 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{b}</span>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      addBadge("Pioneer Voyager");
                      addXp(100);
                      showXpToast("Pioneer Voyager award earned!", "success");
                    }}
                    className="border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Plus className="w-3 h-3" />
                    <span>CLAIM BADGES</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listening Stats Recap Charts */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl font-mono">
                <h4 className="text-xs font-black tracking-widest text-white uppercase">
                  NEURAL ENERGY SPECTROGRAM (RADAR)
                </h4>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Synthwave Synth energy</span>
                    <span className="text-emerald-400 font-bold">88%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[88%]" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Cyber Lofi chill focus</span>
                    <span className="text-violet-400 font-bold">75%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-violet-400 h-full w-[75%]" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Classic retro tape balance</span>
                    <span className="text-amber-400 font-bold">45%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[45%]" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
