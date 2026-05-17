import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { FloatingPet } from "@/components/features/pet/FloatingPet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
      <FloatingPet />
    </div>
  );
}
