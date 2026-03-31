"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface Props {
  data: { month: string; revenue: number; orders: number }[];
}

export default function RevenueChart({ data }: Props) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DF" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#1A1A1A80" }}
            axisLine={{ stroke: "#E5E3DF" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#1A1A1A80" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toLocaleString()
            }
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: "1px solid #E5E3DF",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, "売上"]}
          />
          <Bar dataKey="revenue" fill="#C9A96E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
