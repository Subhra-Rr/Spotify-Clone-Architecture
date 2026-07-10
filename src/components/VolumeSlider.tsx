import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { motion } from "motion/react";

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function VolumeSlider({ volume, onVolumeChange }: VolumeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [preMuteVolume, setPreMuteVolume] = useState(0.5);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleVolumeClick = () => {
    if (volume > 0) {
      setPreMuteVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(preMuteVolume > 0 ? preMuteVolume : 0.5);
    }
  };

  const calculateVolumeFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    onVolumeChange(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateVolumeFromEvent(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    calculateVolumeFromEvent(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      calculateVolumeFromEvent(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      calculateVolumeFromEvent(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  return (
    <div 
      className="flex items-center gap-2.5 group/volume"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleVolumeClick}
        className="text-[#b3b3b3] hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 active:scale-95"
        title={volume === 0 ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>

      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative h-1 w-24 rounded-full bg-[#4d4d4d] cursor-pointer flex items-center py-2"
      >
        <div className="absolute left-0 right-0 h-1 rounded-full bg-[#4d4d4d]" />
        
        {/* Active bar */}
        <div
          className={`absolute left-0 h-1 rounded-full transition-all duration-75 ${
            isHovered || isDragging ? "bg-[#c084fc]" : "bg-white"
          }`}
          style={{ width: `${volume * 100}%` }}
        />

        {/* Thumb */}
        <motion.div
          animate={{
            scale: isHovered || isDragging ? 1 : 0,
            opacity: isHovered || isDragging ? 1 : 0,
          }}
          transition={{ duration: 0.1 }}
          className="absolute h-3 w-3 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.5)] -ml-1.5"
          style={{ left: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
}

export default VolumeSlider;
