import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { CloudSyncBanner } from "@/components/features/onboarding/CloudSyncBanner";
import { FloatingPet } from "@/components/features/pet/FloatingPet";
import { PetCompanionProvider } from "@/components/features/pet/PetCompanionProvider";
import { PwaMonitorProvider } from "@/components/features/fomo/PwaMonitorProvider";
import { TextSizeProvider } from "@/components/ui/TextSizeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TextSizeProvider>
      <PetCompanionProvider>
        <PwaMonitorProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <TopBar />
            <CloudSyncBanner />
            <main className="flex-1 overflow-y-auto pb-24">{children}</main>
            <BottomNav />
            <FloatingPet />
          </div>
        </PwaMonitorProvider>
      </PetCompanionProvider>
    </TextSizeProvider>
  );
}
