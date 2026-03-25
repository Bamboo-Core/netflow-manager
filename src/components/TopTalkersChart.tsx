"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopTalkerData {
  addr: string;
  bytes: number;
}

interface TopTalkersChartProps {
  data: TopTalkerData[];
  title: string;
  color?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function TopTalkersChart({
  data,
  title,
  color = "#06b6d4",
}: TopTalkersChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">Sem dados</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            tickFormatter={formatBytes}
            stroke="#6b7280"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="addr"
            width={120}
            stroke="#6b7280"
            fontSize={11}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value) => [formatBytes(Number(value ?? 0)), "Bytes"]}
          />
          <Bar dataKey="bytes" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
