import { AchievementGrid } from "@/components/features/persona/AchievementGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BadgesPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/profiles" className="text-muted hover:text-foreground transition-colors active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Badges</h1>
          <p className="font-sans text-xs text-muted">Tap any badge to see progress & details</p>
        </div>
      </div>

      <AchievementGrid />
    </div>
  );
}
