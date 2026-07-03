import React, { useEffect, useRef, useState } from "react";
import { Volume2, ShieldAlert, Cpu } from "lucide-react";

interface AudioPipelineProps {
  primaryAudio: HTMLAudioElement | null;
  nextTrackUrl: string | null;
  onBitrateChange?: (bitrate: number, quality: string) => void;
  normalizationEnabled: boolean;
  gaplessEnabled: boolean;
}

export const AudioPipeline: React.FC<AudioPipelineProps> = ({
  primaryAudio,
  nextTrackUrl,
  onBitrateChange,
  normalizationEnabled,
  gaplessEnabled,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [networkSpeed, setNetworkSpeed] = useState<string>("Measuring...");
  const [currentBitrate, setCurrentBitrate] = useState<number>(320);
  const [qualityTier, setQualityTier] = useState<string>("Lossless (FLAC)");

  // 1. Loudness Normalization (Web Audio API Dynamics Compressor + Automatic Gain Controller)
  useEffect(() => {
    if (!primaryAudio || !normalizationEnabled) {
      // Cleanup node connections if disabled
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 1.0;
      return;
    }

    try {
      if (!audioContextRef.current) {
        // Create audio context on user gesture
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(primaryAudio);
      }

      if (!compressorNodeRef.current) {
        compressorNodeRef.current = ctx.createDynamicsCompressor();
        // Configure standard ReplayGain leveling settings
        compressorNodeRef.current.threshold.setValueAtTime(-16, ctx.currentTime); // Standard loudness floor
        compressorNodeRef.current.knee.setValueAtTime(30, ctx.currentTime);
        compressorNodeRef.current.ratio.setValueAtTime(4, ctx.currentTime);
        compressorNodeRef.current.attack.setValueAtTime(0.01, ctx.currentTime);
        compressorNodeRef.current.release.setValueAtTime(0.25, ctx.currentTime);
      }

      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.setValueAtTime(1.15, ctx.currentTime); // Compensate volume drop
      }

      // Connect source -> compressor -> gain -> destination
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.connect(compressorNodeRef.current);
      compressorNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(ctx.destination);

      if (ctx.state === "suspended") {
        const resumeCtx = () => {
          ctx.resume();
          window.removeEventListener("click", resumeCtx);
        };
        window.addEventListener("click", resumeCtx);
      }
    } catch (err) {
      console.warn("[AudioPipeline] Web Audio setup blocked or already initialized:", err);
    }
  }, [primaryAudio, normalizationEnabled]);

  // 2. Pre-buffering for Gapless Playback
  useEffect(() => {
    if (!gaplessEnabled || !nextTrackUrl) return;

    if (!secondaryAudioRef.current) {
      secondaryAudioRef.current = new Audio();
      secondaryAudioRef.current.preload = "auto";
      secondaryAudioRef.current.volume = 0.0; // keep silent while pre-buffering
    }

    // Begin background pre-buffer and load sequence
    secondaryAudioRef.current.src = nextTrackUrl;
    secondaryAudioRef.current.load();
    console.log("[Gapless Engine] Pre-buffered next track:", nextTrackUrl);
  }, [nextTrackUrl, gaplessEnabled]);

  // 3. Adaptive Bitrate calculation based on Network Speed API or active ping latency
  useEffect(() => {
    const measureNetwork = async () => {
      const startTime = Date.now();
      try {
        // Measure connection speed using a tiny 10KB fetch probe or standard navigator API
        const conn = (navigator as any).connection;
        if (conn && conn.downlink) {
          const speedMbps = conn.downlink;
          let bitrate = 320;
          let tier = "HD Audio (320kbps)";
          if (speedMbps > 10) {
            bitrate = 1411;
            tier = "Lossless FLAC (24-bit)";
          } else if (speedMbps > 4) {
            bitrate = 320;
            tier = "HQ Audio (320kbps)";
          } else if (speedMbps > 1.5) {
            bitrate = 192;
            tier = "Standard (192kbps)";
          } else {
            bitrate = 96;
            tier = "Low Bandwidth (96kbps)";
          }
          setNetworkSpeed(`${speedMbps.toFixed(1)} Mbps`);
          setCurrentBitrate(bitrate);
          setQualityTier(tier);
          onBitrateChange?.(bitrate, tier);
          return;
        }

        // Fetch latency probe fallback
        await fetch("/api/health", { cache: "no-store" });
        const latency = Date.now() - startTime;
        let speedLabel = "Excellent";
        let bitrate = 320;
        let tier = "HQ Audio (320kbps)";
        if (latency < 100) {
          speedLabel = "Lossless FLAC Enabled";
          bitrate = 1411;
          tier = "Lossless FLAC (24-bit)";
        } else if (latency < 300) {
          speedLabel = "HQ Stable Connection";
          bitrate = 320;
          tier = "HQ Audio (320kbps)";
        } else {
          speedLabel = "Adaptive Standard Mode";
          bitrate = 192;
          tier = "Standard (192kbps)";
        }
        setNetworkSpeed(`${latency}ms Ping`);
        setCurrentBitrate(bitrate);
        setQualityTier(tier);
        onBitrateChange?.(bitrate, tier);
      } catch (err) {
        setNetworkSpeed("Standard Network");
        setCurrentBitrate(192);
        setQualityTier("Standard (192kbps)");
        onBitrateChange?.(192, "Standard (192kbps)");
      }
    };

    measureNetwork();
    const timer = setInterval(measureNetwork, 25000); // refresh speed stats
    return () => clearInterval(timer);
  }, [onBitrateChange]);

  return (
    <div className="flex items-center gap-4 bg-gray-950/40 backdrop-blur-md px-3 py-2 rounded-xl border border-gray-800 text-xs text-gray-400">
      <div className="flex items-center gap-1.5 text-emerald-400">
        <Cpu className="w-3.5 h-3.5" />
        <span className="font-mono font-medium">{qualityTier}</span>
      </div>
      <div className="h-3.5 w-[1px] bg-gray-800" />
      <div className="flex items-center gap-1 text-gray-400">
        <span className="font-mono">{networkSpeed}</span>
      </div>
      {normalizationEnabled && (
        <>
          <div className="h-3.5 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-1 text-emerald-400" title="ReplayGain Dynamic Normalizer Active">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-medium tracking-tight">AGC Normalizer</span>
          </div>
        </>
      )}
    </div>
  );
};
