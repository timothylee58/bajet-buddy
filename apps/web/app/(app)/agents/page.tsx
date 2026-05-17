import { AgentRoster } from "@/components/features/gamification/AgentRoster";
import { LootBoxReveal } from "@/components/features/gamification/LootBoxReveal";

export default function AgentsPage() {
  return (
    <main className="flex flex-col gap-10 px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Agents &amp; Rewards</h1>
      <AgentRoster />
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Loot Box</h2>
        <LootBoxReveal onClose={() => {}} />
      </section>
    </main>
  );
}
