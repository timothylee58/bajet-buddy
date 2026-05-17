import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { CloudSyncBanner } from "@/components/features/onboarding/CloudSyncBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <TopBar />
      <CloudSyncBanner />
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
