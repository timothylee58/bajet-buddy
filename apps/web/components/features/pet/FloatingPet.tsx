"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw } from "lucide-react";
import type { PetSpecies } from "@/types";
import { usePet } from "./PetCompanionProvider";
import { PetSpeechBubble } from "./PetSpeechBubble";
import { PetSelectorModal } from "./PetSelectorModal";
import { PetLevelUpToast, AccessoryUnlockToast } from "./PetLevelUpToast";
import { getStageForXp, MOOD_ANIMATIONS, MOOD_GLOW } from "./petConfig";

export function FloatingPet() {
  const {
    profile, nudge, xpToNext, progressPct,
    loading, levelUpPending, newAccessory,
    refresh, changePet, dismissLevelUp, dismissAccessory,
  } = usePet();

  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handlePetClick = useCallback(() => {
    if (!bubbleVisible) {
      setBubbleVisible(true);
      refresh("dashboard_open");
    } else {
      setExpanded((v) => !v);
    }
  }, [bubbleVisible, refresh]);

  const handleSpeciesSelect = useCallback(async (species: PetSpecies) => {
    await changePet(species);
  }, [changePet]);

  if (loading || !profile) return null;

  const stage = getStageForXp(profile.species, profile.xp);
  const anim = MOOD_ANIMATIONS[profile.mood];
  const glow = MOOD_GLOW[profile.mood];

  // Mood ring color for the pulse effect
  const moodRingColor: Record<string, string> = {
    happy:       "ring-emerald-400/60",
    celebrating: "ring-amber-400/80",
    worried:     "ring-orange-400/60",
    warning:     "ring-red-500/70",
    sleepy:      "ring-slate-300/50",
    neutral:     "ring-indigo-400/50",
  };
  const ringColor = moodRingColor[profile.mood] ?? moodRingColor.neutral;

  return (
    <>
      {/* Main floating container — responsive: smaller on mobile, larger on md+ */}
      <div
        className="fixed bottom-[5.5rem] right-3 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-2"
        role="complementary"
        aria-label="Pet companion"
      >
        {/* Speech bubble — wider on desktop */}
        <PetSpeechBubble
          nudge={nudge}
          visible={bubbleVisible}
          onDismiss={() => setBubbleVisible(false)}
          side="left"
        />

        {/* Expanded info card */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-white/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl w-60 md:w-64"
            >
              {/* Pet name + level */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-headline text-sm font-bold text-foreground">{profile.name}</p>
                  <p className="font-sans text-[10px] text-muted">
                    Level {profile.level} · {profile.xp.toLocaleString()} XP
                  </p>
                </div>
                <span className="text-2xl">{profile.streak > 0 ? "🔥" : "💤"}</span>
              </div>

              {/* XP bar */}
              <div className="mb-4">
                <div className="flex justify-between font-sans text-[10px] text-muted mb-1">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-500" /> XP Progress
                  </span>
                  <span className="font-bold text-foreground">{progressPct}%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {xpToNext > 0 && (
                  <p className="font-sans text-[10px] text-muted mt-1">
                    {xpToNext} XP to evolve
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectorOpen(true); setExpanded(false); }}
                  className="flex-1 font-sans text-[11px] py-2 rounded-xl bg-primary-light text-primary font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  Switch Pet
                </button>
                <button
                  onClick={() => {
                    setBubbleVisible(true);
                    setExpanded(false);
                    refresh("dashboard_open");
                  }}
                  className="flex-1 flex items-center justify-center gap-1 font-sans text-[11px] py-2 rounded-xl bg-zinc-100 text-zinc-600 font-bold hover:bg-zinc-200 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  New tip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pet button */}
        <motion.button
          onClick={handlePetClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
          aria-label={`${profile.name} — tap for advice`}
        >
          {/* Outer attention-pulse ring */}
          <motion.span
            className={`absolute inset-0 rounded-full ring-4 ${ringColor}`}
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          />

          {/* Glow + float animation */}
          <motion.div
            animate={{ y: anim.y, scale: anim.scale, rotate: anim.rotate }}
            transition={{
              repeat: Infinity,
              duration: profile.mood === "sleepy" ? 3.5 : 2,
              ease: "easeInOut",
            }}
            style={{ filter: glow }}
            className="relative"
          >
            {/* Pet image — 84px mobile, 96px md+ */}
            <Image
              src={stage.image}
              alt={stage.name}
              width={96}
              height={96}
              className="w-[84px] h-[84px] md:w-[96px] md:h-[96px] object-contain drop-shadow-xl"
              priority
            />
          </motion.div>

          {/* Streak fire badge */}
          {profile.streak >= 7 && (
            <motion.span
              className="absolute -top-1.5 -right-1 text-base md:text-lg"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🔥
            </motion.span>
          )}

          {/* Celebrating confetti */}
          {profile.mood === "celebrating" && (
            <motion.span
              className="absolute -top-2 -left-1 text-base"
              animate={{ rotate: [-10, 10, -10], y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🎉
            </motion.span>
          )}

          {/* Warning badge */}
          {profile.mood === "warning" && (
            <motion.span
              className="absolute -top-1.5 -right-1.5 text-base"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              ⚠️
            </motion.span>
          )}

          {/* "Tap me" hint — only when bubble is dismissed */}
          {!bubbleVisible && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-border rounded-full px-2 py-0.5 font-sans text-[10px] font-bold text-primary shadow-sm"
            >
              Tap me! 👆
            </motion.div>
          )}
        </motion.button>
      </div>

      <PetSelectorModal
        open={selectorOpen}
        currentSpecies={profile.species}
        onSelect={handleSpeciesSelect}
        onClose={() => setSelectorOpen(false)}
      />
      <PetLevelUpToast level={levelUpPending ? profile.level : null} onDismiss={dismissLevelUp} />
      <AccessoryUnlockToast accessory={newAccessory} onDismiss={dismissAccessory} />
    </>
  );
}
