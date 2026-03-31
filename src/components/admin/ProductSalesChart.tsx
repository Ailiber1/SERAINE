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
  data: { name: string; revenue: number; quantity: number }[];
}

export default function ProductSalesChart({ data }: Props) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DF" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#1A1A1A80" }}
            axisLine={{ stroke: "#E5E3DF" }}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toLocaleString()
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "#1A1A1A80" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: "1px solid #E5E3DF",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            formatter={(value, name) => {
              const num = Number(value) || 0;
              if (name === "revenue") return [`¥${num.toLocaleString()}`, "売上"];
              return [num, "販売数"];
            }}
          />
          <Bar dataKey="revenue" fill="#C9A96E" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
