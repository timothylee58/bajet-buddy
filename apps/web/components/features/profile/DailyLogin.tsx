"use client";

import { useGamification } from "@/hooks/useGamification";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DailyLogin() {
  const { status, loading } = useGamification();

  if (loading) return null;

  // Mock days of the week
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDay = new Date().getDay(); // 0-6 (Sun-Sat)
  // Adjust to 0-6 (Mon-Sun)
  const adjustedCurrentDay = (currentDay + 6) % 7;

  return (
    <Card className="p-4 border-dashed border-gray-200 shadow-none bg-zinc-50/50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-700">Daily Login</h3>
        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">
          Active
        </span>
      </div>

      <div className="flex justify-between gap-1">
        {days.map((day, i) => {
          const isPast = i < adjustedCurrentDay;
          const isToday = i === adjustedCurrentDay;
          const isStreak = i <= adjustedCurrentDay; // Simplified logic for demo

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "w-full aspect-square rounded-lg flex items-center justify-center text-sm transition-all",
                  isToday
                    ? "bg-primary text-white shadow-md shadow-primary-light scale-110"
                    : isPast && isStreak
                    ? "bg-primary-light text-primary"
                    : "bg-white text-gray-300 border border-gray-100"
                )}
              >
                {isPast && isStreak ? "✅" : isToday ? "🔥" : "💎"}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isToday ? "text-primary" : "text-gray-400"
                )}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
      
      <p className="text-[11px] text-gray-500 mt-4 text-center">
        Log in every day to maintain your <span className="font-bold text-orange-600">{status.streak} day streak</span>!
      </p>
    </Card>
  );
}
