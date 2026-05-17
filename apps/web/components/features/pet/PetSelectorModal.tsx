"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { PetSpecies } from "@/types";
import { PET_SPECIES } from "./petConfig";

const SPECIES_ORDER: PetSpecies[] = ["squirrel", "fox", "raccoon", "rabbit", "finance_squirrel"];

interface PetSelectorModalProps {
  open: boolean;
  currentSpecies: PetSpecies;
  onSelect: (species: PetSpecies) => void;
  onClose: () => void;
}

export function PetSelectorModal({ open, currentSpecies, onSelect, onClose }: PetSelectorModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-extrabold text-zinc-900 mb-1">Choose Your Companion</h2>
            <p className="text-xs text-zinc-500 mb-5">Your buddy grows with you. Pick wisely~</p>

            <div className="grid grid-cols-3 gap-3">
              {SPECIES_ORDER.map((species) => {
                const config = PET_SPECIES[species];
                const stage = config.stages[0];
                const isActive = species === currentSpecies;
                const isLocked = config.locked;

                return (
                  <motion.button
                    key={species}
                    whileTap={{ scale: isLocked ? 1 : 0.95 }}
                    onClick={() => { if (!isLocked) { onSelect(species); onClose(); } }}
                    className={[
                      "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                      isActive
                        ? "border-emerald-400 bg-emerald-50"
                        : isLocked
                        ? "border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed"
                        : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer",
                    ].join(" ")}
                    aria-pressed={isActive}
                    aria-disabled={isLocked}
                  >
                    {isLocked && (
                      <span className="absolute top-2 right-2 text-base">🔒</span>
                    )}
                    {isActive && (
                      <span className="absolute top-2 left-2 text-base">✅</span>
                    )}
                    <Image
                      src={stage.image}
                      alt={config.label}
                      width={72}
                      height={72}
                      className="w-18 h-18 object-contain"
                    />
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-800">{config.label}</p>
                      <p className="text-[10px] text-zinc-500">{config.emoji}</p>
                      {isLocked && (
                        <p className="text-[10px] text-amber-600 font-medium mt-0.5">{config.lockReason}</p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-xl bg-zinc-100 text-zinc-600 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Keep current buddy
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
