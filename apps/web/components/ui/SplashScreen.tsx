"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  show: boolean;
  onComplete: () => void;
}

export function SplashScreen({ show, onComplete }: SplashScreenProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#064e3b]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Bajet-Buddy
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
