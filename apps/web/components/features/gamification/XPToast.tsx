"use client";

import { motion, AnimatePresence } from "framer-motion";

interface XPToastProps {
  xp: number;
  visible: boolean;
}

export function XPToast({ xp, visible }: XPToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2 text-sm font-bold"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">⭐</span>
          +{xp} XP earned!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
