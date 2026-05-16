import { Leaderboard } from "@/components/features/buddies/Leaderboard";
import { ChallengeCard } from "@/components/features/buddies/ChallengeCard";

export default function BuddiesPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Buddies 👥</h1>

      <ChallengeCard
        title="No Shopee Week"
        description="Don't buy anything on Shopee for 7 days"
        participants={12}
        daysLeft={3}
        joined={true}
      />

      <Leaderboard />
    </div>
  );
}
