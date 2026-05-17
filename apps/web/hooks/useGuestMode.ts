"use client";

import { useState, useEffect } from "react";

export type GuestData = {
  onboarding: {
    ocr_pitch_seen: boolean;
    questions_answered: boolean;
    answers: Array<{ question: number; answer: string; xp: number }>;
  };
  persona: any;
  estimated_budget: any;
  transactions: any[];
  xp: number;
  streak: number;
  badges: string[];
  freeze_events: any[];
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

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestData, setGuestData] = useState<GuestData>(INITIAL_GUEST_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guestMode = localStorage.getItem("bb_guest_mode") === "true";
    setIsGuest(guestMode);

    if (guestMode) {
      const data = localStorage.getItem("bb_guest_data");
      if (data) {
        try {
          setGuestData(JSON.parse(data));
        } catch (e) {
          console.error("Failed to parse guest data", e);
        }
      }
    }
    setLoading(false);
  }, []);

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
