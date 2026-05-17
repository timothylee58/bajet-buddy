"use client";

import { useGamification } from "@/hooks/useGamification";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ProfileHeader() {
  const { status, loading } = useGamification();

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary-light/50 to-white border-primary-light shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Level {status.level}
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{status.level_name}</h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
            <span>🔥</span>
            <span>{status.streak} Day Streak</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500 font-medium">{status.xp} XP Total</span>
          <span className="text-primary font-bold">{Math.round(status.progress_pct)}%</span>
        </div>
        <Progress value={status.progress_pct} className="h-2.5 bg-primary-light" />
        <p className="text-xs text-gray-400 mt-2">
          {status.xp_to_next - status.xp} XP more to reach next level
        </p>
      </div>
    </Card>
  );
}
