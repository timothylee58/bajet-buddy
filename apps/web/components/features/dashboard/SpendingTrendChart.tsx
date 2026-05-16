"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const WEEKLY_SPEND = [
  { day: "Mon", spent: 120 },
  { day: "Tue", spent: 85 },
  { day: "Wed", spent: 210 },
  { day: "Thu", spent: 95 },
  { day: "Fri", spent: 180 },
  { day: "Sat", spent: 320 },
  { day: "Sun", spent: 140 },
];

export function SpendingTrendChart() {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
        Weekly spend (RM)
      </h2>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WEEKLY_SPEND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={36} />
            <Tooltip
              formatter={(value) => [`RM${value ?? 0}`, "Spent"]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="spent"
              stroke="#16a34a"
              fill="url(#spendFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
