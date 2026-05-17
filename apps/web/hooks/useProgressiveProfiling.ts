"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateProfilingGoal,
  getProfilingSummary,
} from "@/lib/api";
import type {
  ProfilingGoalType,
  ProgressiveProfilingSummary,
} from "@/types";

const DEFAULT_SUMMARY: ProgressiveProfilingSummary = {
  profile_score: 78,
  principle: "Data comes from value, not before value.",
  next_best_action: "Ask for one savings goal next, because passive behaviour is already producing value.",
  layers: [
    {
      id: "layer_0",
      title: "Layer 0 - Instant Gratification",
      status: "complete",
      description: "Bajet Buddy gives a verdict before asking for profile depth.",
      value_unlocked: "Instant spend check, nudge, and projected daily runway.",
      signals: ["Quick verdict already available."],
      cta: "Run a spend check",
    },
    {
      id: "layer_1",
      title: "Layer 1 - Passive Capture",
      status: "active",
      description: "Transactions, merchants, and timing are captured from product usage.",
      value_unlocked: "Budget heartbeat and passive merchant memory.",
      signals: ["Behaviour is already being captured passively."],
      cta: "Keep using Bajet Buddy",
    },
    {
      id: "layer_2",
      title: "Layer 2 - Recurring Pattern Detection",
      status: "active",
      description: "Recurring pattern detection activates after enough observed history exists.",
      value_unlocked: "Recurring payday and late-night pattern insights.",
      signals: ["14+ days observed in demo mode."],
      cta: "Review detected patterns",
    },
    {
      id: "layer_3",
      title: "Layer 3 - Goal-Directed Data",
      status: "available",
      description: "High-commitment data is only requested when the user decides to pursue a goal.",
      value_unlocked: "Goal-aware nudges, XP pacing, and AI agent unlocks.",
      signals: ["No explicit goal chosen yet."],
      cta: "Start a savings goal",
    },
  ],
  goals: [],
  unlockable_agents: [],
  xp: 420,
  streak: 7,
  days_observed: 17,
};

export function useProgressiveProfiling() {
  const [summary, setSummary] = useState<ProgressiveProfilingSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfilingSummary();
      setSummary(data);
    } catch (err) {
      setSummary(DEFAULT_SUMMARY);
      setError(err instanceof Error ? err.message : "Unable to load profiling summary");
    } finally {
      setLoading(false);
    }
  }, []);

  const activateGoal = useCallback(
    async (type: ProfilingGoalType, commitmentAmount: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await activateProfilingGoal(type, commitmentAmount);
        setSummary(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to activate goal");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  return { summary, loading, error, refresh, activateGoal };
}
