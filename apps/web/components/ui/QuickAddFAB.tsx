"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface QuickAddFABProps {
  onClick: () => void;
}

export function QuickAddFAB({ onClick }: QuickAddFABProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
      aria-label="Add expense"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </motion.button>
  );
}
