"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

interface BudgetChartProps {
  data: ChartEntry[];
}

export function BudgetChart({ data }: BudgetChartProps) {
  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            strokeWidth={2}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
