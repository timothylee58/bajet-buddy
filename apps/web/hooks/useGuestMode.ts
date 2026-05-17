"use client";

import { useState } from "react";

export type GuestData = {
  onboarding: {
    ocr_pitch_seen: boolean;
    questions_answered: boolean;
    answers: Array<{ question: number; answer: string; xp: number }>;
  };
  persona: Record<string, unknown> | null;
  estimated_budget: { category: string; amount: number; color: string; percentage: number }[] | null;
  transactions: Record<string, unknown>[];
  xp: number;
  streak: number;
  badges: string[];
  freeze_events: Record<string, unknown>[];
};

const INITIAL_GUEST_DATA: GuestData = {
  onboarding: {
    ocr_pitch_seen: false,
    questions_answered: false,
    answers: [],
  },
  persona: null,
  estimated_budget: null,
  transactions: [],
  xp: 0,
  streak: 0,
  badges: [],
  freeze_events: [],
};

function readGuestState(): { isGuest: boolean; guestData: GuestData } {
  if (typeof window === "undefined") {
    return { isGuest: false, guestData: INITIAL_GUEST_DATA };
  }
  const isGuest = localStorage.getItem("bb_guest_mode") === "true";
  if (!isGuest) return { isGuest: false, guestData: INITIAL_GUEST_DATA };
  const raw = localStorage.getItem("bb_guest_data");
  if (raw) {
    try {
      return { isGuest, guestData: JSON.parse(raw) as GuestData };
    } catch {
      // corrupted — fall through to defaults
    }
  }
  return { isGuest, guestData: INITIAL_GUEST_DATA };
}

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean>(() => readGuestState().isGuest);
  const [guestData, setGuestData] = useState<GuestData>(() => readGuestState().guestData);
  const loading = false;

  const enableGuestMode = () => {
    localStorage.setItem("bb_guest_mode", "true");
    setIsGuest(true);
    // Initialize with default data if empty
    if (!localStorage.getItem("bb_guest_data")) {
      localStorage.setItem("bb_guest_data", JSON.stringify(INITIAL_GUEST_DATA));
    }
  };

  const updateGuestData = (updater: (prev: GuestData) => GuestData) => {
    setGuestData((prev) => {
      const newData = updater(prev);
      localStorage.setItem("bb_guest_data", JSON.stringify(newData));
      return newData;
    });
  };

  const addXP = (amount: number) => {
    updateGuestData((prev) => ({
      ...prev,
      xp: prev.xp + amount,
    }));
  };

  return {
    isGuest,
    guestData,
    loading,
    enableGuestMode,
    updateGuestData,
    addXP,
  };
}
