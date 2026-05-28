"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AnalyticsChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: "#8A8680", fontFamily: "Montserrat, sans-serif" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#8A8680", fontFamily: "Montserrat, sans-serif" }}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(212,175,55,0.06)" }}
          contentStyle={{
            fontFamily: "Montserrat, sans-serif",
            borderRadius: "10px",
            border: "1px solid #E8E2D9",
            boxShadow: "0 4px 16px rgba(26,26,26,0.08)",
            fontSize: "13px",
          }}
          formatter={(val) => [`${val} bookings`, ""]}
          labelFormatter={(label) => `${label}`}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.count === max && entry.count > 0 ? "#D4AF37" : "rgba(212,175,55,0.25)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
