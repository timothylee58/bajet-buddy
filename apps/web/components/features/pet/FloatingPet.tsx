"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <>
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2" role="complementary" aria-label="Pet companion">
        <PetSpeechBubble
          nudge={nudge}
          visible={bubbleVisible}
          onDismiss={() => setBubbleVisible(false)}
          side="left"
        />

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              className="bg-surface/90 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-xl w-56"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-foreground">{profile.name}</p>
                  <p className="text-[10px] text-muted">Level {profile.level} · {profile.xp} XP</p>
                </div>
                <span className="text-xl">{profile.streak > 0 ? "🔥" : "💤"}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted mb-1">
                  <span>XP Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-neutral-light rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {xpToNext > 0 && (
                  <p className="text-[10px] text-muted mt-1">{xpToNext} XP to evolve</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectorOpen(true); setExpanded(false); }}
                  className="flex-1 text-[11px] py-2 rounded-xl bg-primary-light text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
                >
                  Switch Pet
                </button>
                <button
                  onClick={() => { setBubbleVisible(true); setExpanded(false); refresh("dashboard_open"); }}
                  className="flex-1 text-[11px] py-2 rounded-xl bg-secondary-light text-secondary-dark font-semibold hover:bg-secondary hover:text-white transition-colors"
                >
                  Get Advice
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handlePetClick}
          whileTap={{ scale: 0.9 }}
          className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
          aria-label={`${profile.name} — tap for advice`}
        >
          <motion.div
            animate={{ y: anim.y, scale: anim.scale, rotate: anim.rotate }}
            transition={{ repeat: Infinity, duration: profile.mood === "sleepy" ? 3.5 : 2, ease: "easeInOut" }}
            style={{ filter: glow }}
          >
            <Image
              src={stage.image}
              alt={stage.name}
              width={72}
              height={72}
              className="w-16 h-16 object-contain"
              priority
            />
          </motion.div>

          {profile.streak >= 7 && (
            <motion.span
              className="absolute -top-1 -right-1 text-sm"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🔥
            </motion.span>
          )}
          {profile.mood === "celebrating" && (
            <motion.span
              className="absolute -top-2 -left-1 text-sm"
              animate={{ rotate: [-10, 10, -10], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🎉
            </motion.span>
          )}
          {profile.mood === "warning" && (
            <motion.span
              className="absolute -top-1 -right-1 text-sm"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              ⚠️
            </motion.span>
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
