"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrafficDataPoint {
  time: string;
  bytes: number;
  packets: number;
}

interface TrafficChartProps {
  data: TrafficDataPoint[];
  title?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrafficChart({ data, title = "Trafego ao Longo do Tempo" }: TrafficChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">Sem dados de trafego</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#6b7280"
            fontSize={11}
          />
          <YAxis
            tickFormatter={formatBytes}
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
            labelFormatter={(label) => formatTime(String(label))}
          />
          <Area
            type="monotone"
            dataKey="bytes"
            stroke="#06b6d4"
            fill="url(#colorBytes)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
