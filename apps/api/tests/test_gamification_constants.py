from __future__ import annotations

import sys
import unittest
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.services.gamification_service import LEVELS, XP_TABLE, level_for_xp, xp_for_verdict
from app.services.loot_box_service import REWARDS

# Pinned in CLAUDE.md's "Gamification constants (do not invent values)" section.
# A drift here silently changes payouts across the app without anyone noticing.


class XpTableTests(unittest.TestCase):
    def test_verdict_xp_values_match_the_documented_constants(self) -> None:
        self.assertEqual(xp_for_verdict("boleh"), 10)
        self.assertEqual(xp_for_verdict("fikir_dulu"), 5)
        self.assertEqual(xp_for_verdict("jangan_dulu"), 0)

    def test_unknown_verdict_awards_no_xp(self) -> None:
        self.assertEqual(xp_for_verdict("not_a_real_verdict"), 0)

    def test_xp_table_has_no_undocumented_extra_verdicts(self) -> None:
        self.assertEqual(set(XP_TABLE.keys()), {"boleh", "fikir_dulu", "jangan_dulu"})


class LevelThresholdTests(unittest.TestCase):
    def test_level_boundaries(self) -> None:
        self.assertEqual(level_for_xp(0)[0], 1)
        self.assertEqual(level_for_xp(199)[0], 1)
        self.assertEqual(level_for_xp(200)[0], 2)
        self.assertEqual(level_for_xp(499)[0], 2)
        self.assertEqual(level_for_xp(500)[0], 3)
        self.assertEqual(level_for_xp(999)[0], 3)
        self.assertEqual(level_for_xp(1000)[0], 4)
        self.assertEqual(level_for_xp(1999)[0], 4)
        self.assertEqual(level_for_xp(2000)[0], 5)

    def test_levels_are_contiguous_with_no_gaps(self) -> None:
        for (_, _, prev_max, _), (_, next_min, _, _) in zip(LEVELS, LEVELS[1:]):
            self.assertEqual(prev_max, next_min)


class LootBoxRewardTests(unittest.TestCase):
    def test_loot_box_coin_tiers_match_the_documented_constants(self) -> None:
        coins_by_rarity = {r["rarity"]: r["coins"] for r in REWARDS}
        self.assertEqual(
            coins_by_rarity,
            {"common": 10, "rare": 25, "epic": 50, "legendary": 100},
        )

    def test_loot_box_weights_sum_to_100(self) -> None:
        self.assertEqual(sum(r["weight"] for r in REWARDS), 100)


if __name__ == "__main__":
    unittest.main()
