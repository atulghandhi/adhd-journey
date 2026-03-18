"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CompletionChartProps {
  completionRate: number;
  inProgressRate: number;
}

const COLORS = ["#40916C", "#D8F3DC"];

export function CompletionChart({
  completionRate,
  inProgressRate,
}: CompletionChartProps) {
  const data = [
    { name: "Completed", value: completionRate },
    { name: "In progress", value: inProgressRate },
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={72}
            outerRadius={110}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell fill={COLORS[index] ?? COLORS[0]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${String(value ?? 0)}%`, "Share"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
