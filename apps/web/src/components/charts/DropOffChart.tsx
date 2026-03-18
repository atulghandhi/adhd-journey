"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DropOffChartProps {
  data: Array<{
    completedUsers: number;
    order: number;
    title: string;
  }>;
}

export function DropOffChart({ data }: DropOffChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#D8F3DC" strokeDasharray="3 3" />
          <XAxis dataKey="order" stroke="#2D6A4F" tickLine={false} />
          <YAxis allowDecimals={false} stroke="#2D6A4F" tickLine={false} />
          <Tooltip
            contentStyle={{
              border: "1px solid #D8F3DC",
              borderRadius: 16,
            }}
            formatter={(value) => [`${String(value ?? 0)} users`, "Completed"]}
            labelFormatter={(value) => `Day ${value}`}
          />
          <Bar dataKey="completedUsers" fill="#40916C" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
