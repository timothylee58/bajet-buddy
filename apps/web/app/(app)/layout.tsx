import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { CloudSyncBanner } from "@/components/features/onboarding/CloudSyncBanner";
import { FloatingPet } from "@/components/features/pet/FloatingPet";
import { PetCompanionProvider } from "@/components/features/pet/PetCompanionProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PetCompanionProvider>
      <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.12),_transparent_28rem),radial-gradient(circle_at_top_right,_rgba(79,195,247,0.12),_transparent_24rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]">
        <TopBar />
        <CloudSyncBanner />
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
        <BottomNav />
        <FloatingPet />
      </div>
    </PetCompanionProvider>
  );
}
