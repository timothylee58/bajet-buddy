"use client";

import { motion } from "framer-motion";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export function StreakFlame({ streak, size = "md" }: StreakFlameProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className={SIZE_MAP[size]}
        aria-hidden="true"
      >
        🔥
      </motion.span>
      <span className="text-xs font-bold text-orange-500">
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
