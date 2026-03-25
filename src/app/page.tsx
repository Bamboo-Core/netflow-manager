"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrafficChart from "@/components/TrafficChart";
import ProtocolChart from "@/components/ProtocolChart";
import TopTalkersChart from "@/components/TopTalkersChart";
import type { FlowSummary } from "@/lib/types";

interface HostSummary {
  id: string;
  name: string;
  ipAddress: string;
  vendor: string;
  hostType: string;
  enabled: boolean;
  collecting: boolean;
  _count: { flowRecords: number };
}

export default function DashboardPage() {
  const [hosts, setHosts] = useState<HostSummary[]>([]);
  const [summary, setSummary] = useState<FlowSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hostsRes, summaryRes] = await Promise.all([
          fetch("/api/hosts"),
          fetch("/api/flows/summary"),
        ]);
        const hostsData = await hostsRes.json();
        const summaryData = await summaryRes.json();
        setHosts(hostsData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const totalHosts = hosts.length;
  const activeHosts = hosts.filter((h) => h.enabled).length;
  const collectingHosts = hosts.filter((h) => h.collecting).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Visao geral da rede e trafego</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total de Hosts" value={totalHosts} icon="server" />
        <StatCard title="Hosts Ativos" value={activeHosts} icon="check" color="green" />
        <StatCard title="Coletando" value={collectingHosts} icon="activity" color="cyan" />
        <StatCard
          title="Total de Flows"
          value={summary?.totalFlows || 0}
          icon="flow"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Bytes Totais"
          value={formatBytesDisplay(summary?.totalBytes || 0)}
          color="cyan"
        />
        <SummaryCard
          title="Pacotes Totais"
          value={(summary?.totalPackets || 0).toLocaleString()}
          color="green"
        />
        <SummaryCard
          title="Flows Totais"
          value={(summary?.totalFlows || 0).toLocaleString()}
          color="purple"
        />
      </div>

      <div className="mb-8">
        <TrafficChart data={summary?.trafficOverTime || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopTalkersChart
          data={summary?.topSources || []}
          title="Top 10 Origens (por Bytes)"
          color="#06b6d4"
        />
        <TopTalkersChart
          data={summary?.topDestinations || []}
          title="Top 10 Destinos (por Bytes)"
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProtocolChart data={summary?.protocolDistribution || []} />

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Hosts Recentes</h3>
            <Link href="/hosts" className="text-cyan-400 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          {hosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum host cadastrado</p>
              <Link
                href="/hosts/new"
                className="text-cyan-400 hover:underline text-sm mt-2 inline-block"
              >
                Cadastrar primeiro host
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {hosts.slice(0, 5).map((host) => (
                <Link
                  key={host.id}
                  href={`/hosts/${host.id}`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{host.name}</p>
                    <p className="text-gray-400 text-sm font-mono">{host.ipAddress}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {host.collecting && (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                    <span className="text-gray-400 text-sm">
                      {host._count.flowRecords.toLocaleString()} flows
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = "gray",
}: {
  title: string;
  value: number;
  icon: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: "text-gray-400",
    green: "text-green-400",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
  };

  const iconMap: Record<string, React.ReactNode> = {
    server: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activity: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    flow: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={colorClasses[color]}>{iconMap[icon]}</div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const borderColors: Record<string, string> = {
    cyan: "border-l-cyan-500",
    green: "border-l-green-500",
    purple: "border-l-purple-500",
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 ${borderColors[color]} border-l-4 rounded-xl p-5`}>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function formatBytesDisplay(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
