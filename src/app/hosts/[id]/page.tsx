"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import FlowTable from "@/components/FlowTable";
import TrafficChart from "@/components/TrafficChart";
import { VENDORS, HOST_TYPES, FLOW_PROTOCOLS } from "@/lib/types";

interface Host {
  id: string;
  name: string;
  ipAddress: string;
  vendor: string;
  model: string | null;
  hostType: string;
  flowProtocol: string;
  collectorPort: number;
  description: string | null;
  enabled: boolean;
  collecting: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { flowRecords: number };
}

interface FlowRecord {
  id: string;
  timestamp: string;
  srcAddr: string;
  dstAddr: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  bytes: string;
  packets: string;
}

interface FlowSummary {
  trafficOverTime: { time: string; bytes: number; packets: number }[];
}

function getLabel(items: readonly { value: string; label: string }[], value: string): string {
  return items.find((i) => i.value === value)?.label || value;
}

export default function HostDetailPage() {
  const params = useParams();
  const hostId = params.id as string;

  const [host, setHost] = useState<Host | null>(null);
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [flowSummary, setFlowSummary] = useState<FlowSummary | null>(null);
  const [totalFlows, setTotalFlows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collectLoading, setCollectLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchHost = useCallback(async () => {
    try {
      const res = await fetch(`/api/hosts/${hostId}`);
      if (res.ok) {
        const data = await res.json();
        setHost(data);
      }
    } catch (err) {
      console.error("Error fetching host:", err);
    }
  }, [hostId]);

  const fetchFlows = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/hosts/${hostId}/flows?limit=${limit}&offset=${page * limit}`
      );
      if (res.ok) {
        const data = await res.json();
        setFlows(data.records);
        setTotalFlows(data.total);
      }
    } catch (err) {
      console.error("Error fetching flows:", err);
    }
  }, [hostId, page]);

  const fetchFlowSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/flows/summary?hostId=${hostId}`);
      if (res.ok) {
        const data = await res.json();
        setFlowSummary(data);
      }
    } catch (err) {
      console.error("Error fetching flow summary:", err);
    }
  }, [hostId]);

  useEffect(() => {
    async function loadAll() {
      await Promise.all([fetchHost(), fetchFlows(), fetchFlowSummary()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchHost, fetchFlows, fetchFlowSummary]);

  const handleCollect = async (action: "start" | "stop") => {
    setCollectLoading(true);
    try {
      const res = await fetch(`/api/hosts/${hostId}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao gerenciar coleta");
      }
      await fetchHost();
    } catch {
      alert("Erro de conexao");
    } finally {
      setCollectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white mb-2">Host nao encontrado</h2>
          <Link href="/hosts" className="text-cyan-400 hover:underline">
            Voltar para lista de hosts
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalFlows / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/hosts" className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{host.name}</h1>
          <p className="text-gray-400 font-mono">{host.ipAddress}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/hosts/${host.id}/edit`}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Editar
          </Link>
          {host.enabled && (
            <button
              onClick={() => handleCollect(host.collecting ? "stop" : "start")}
              disabled={collectLoading}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                host.collecting
                  ? "bg-amber-700 hover:bg-amber-600 text-white"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white"
              }`}
            >
              {collectLoading
                ? "..."
                : host.collecting
                ? "Parar Coleta"
                : "Iniciar Coleta"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informacoes do Host</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Fabricante" value={getLabel(VENDORS, host.vendor)} />
            <InfoItem label="Modelo" value={host.model || "N/A"} />
            <InfoItem label="Tipo" value={getLabel(HOST_TYPES, host.hostType)} />
            <InfoItem label="Protocolo de Flow" value={getLabel(FLOW_PROTOCOLS, host.flowProtocol)} />
            <InfoItem label="Porta do Coletor" value={String(host.collectorPort)} />
            <InfoItem label="Total de Flows" value={host._count.flowRecords.toLocaleString()} />
            <InfoItem label="Criado em" value={new Date(host.createdAt).toLocaleString("pt-BR")} />
            <InfoItem label="Atualizado em" value={new Date(host.updatedAt).toLocaleString("pt-BR")} />
          </div>
          {host.description && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">Descricao</p>
              <p className="text-gray-300 mt-1">{host.description}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Habilitado</span>
              <StatusBadge active={host.enabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Coleta</span>
              <StatusBadge
                active={host.collecting}
                activeLabel="Coletando"
                inactiveLabel="Parado"
              />
            </div>
            <div className="pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Flows registrados</p>
              <p className="text-2xl font-bold text-white">
                {host._count.flowRecords.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <TrafficChart
          data={flowSummary?.trafficOverTime || []}
          title={`Trafego - ${host.name}`}
        />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Registros de Flow ({totalFlows.toLocaleString()})
          </h2>
        </div>

        <FlowTable records={flows} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Anterior
            </button>
            <span className="text-gray-400 text-sm">
              Pagina {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Proximo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-300 font-medium">{value}</p>
    </div>
  );
}
