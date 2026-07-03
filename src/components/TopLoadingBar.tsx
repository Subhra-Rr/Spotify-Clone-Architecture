import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function TopLoadingBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleStart = () => {
      setVisible(true);
      setProgress(5);
      
      // Gradually increment to 85%
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          const add = Math.random() * 8 + 2;
          return Math.min(prev + add, 85);
        });
      }, 250);
    };

    const handleStop = () => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200);
      }, 300);
    };

    window.addEventListener("melodystream-loading-start", handleStart);
    window.addEventListener("melodystream-loading-stop", handleStop);

    return () => {
      clearInterval(interval);
      window.removeEventListener("melodystream-loading-start", handleStart);
      window.removeEventListener("melodystream-loading-stop", handleStop);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none bg-black/10">
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--color-accent,#8b5cf6)] via-[#ec4899] to-[var(--color-accent,#8b5cf6)] shadow-[0_1px_8px_rgba(139,92,246,0.5)]"
        initial={{ width: "0%" }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "tween", ease: "easeInOut" }}
      />
    </div>
  );
}

// Utility functions to trigger loading bar from anywhere in the codebase
export const startLoadingBar = () => {
  window.dispatchEvent(new CustomEvent("melodystream-loading-start"));
};

export const stopLoadingBar = () => {
  window.dispatchEvent(new CustomEvent("melodystream-loading-stop"));
};

export default TopLoadingBar;
