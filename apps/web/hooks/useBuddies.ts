"use client";

import { useState, useEffect } from "react";
import { getLeaderboard } from "@/lib/api";
import type { BuddyEntry } from "@/types";

const MOCK_LEADERBOARD: BuddyEntry[] = [
  { rank: 1, user_id: "u1", display_name: "Amirah R.", avatar_emoji: "👸", xp: 980, streak: 14, is_me: false },
  { rank: 2, user_id: "u2", display_name: "You (Sarah)", avatar_emoji: "😊", xp: 420, streak: 7, is_me: true },
  { rank: 3, user_id: "u3", display_name: "Hafiz K.", avatar_emoji: "🧑", xp: 390, streak: 5, is_me: false },
];

export function useBuddies() {
  const [leaderboard, setLeaderboard] = useState<BuddyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setLeaderboard(data as BuddyEntry[]))
      .catch(() => setLeaderboard(MOCK_LEADERBOARD))
      .finally(() => setLoading(false));
  }, []);

  return { leaderboard, loading };
}
