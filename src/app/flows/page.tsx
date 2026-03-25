"use client";

import { useEffect, useState, useCallback } from "react";
import FlowTable from "@/components/FlowTable";

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
  host?: { name: string; ipAddress: string };
}

interface Host {
  id: string;
  name: string;
  ipAddress: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 100;

  const [hostFilter, setHostFilter] = useState("");
  const [srcAddrFilter, setSrcAddrFilter] = useState("");
  const [dstAddrFilter, setDstAddrFilter] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("");

  useEffect(() => {
    async function fetchHosts() {
      try {
        const res = await fetch("/api/hosts");
        const data = await res.json();
        setHosts(data);
      } catch (err) {
        console.error("Error fetching hosts:", err);
      }
    }
    fetchHosts();
  }, []);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(page * limit));
      if (hostFilter) params.set("hostId", hostFilter);
      if (srcAddrFilter) params.set("srcAddr", srcAddrFilter);
      if (dstAddrFilter) params.set("dstAddr", dstAddrFilter);
      if (protocolFilter) params.set("protocol", protocolFilter);

      const res = await fetch(`/api/flows?${params.toString()}`);
      const data = await res.json();
      setFlows(data.records);
      setTotal(data.total);
    } catch (err) {
      console.error("Error fetching flows:", err);
    } finally {
      setLoading(false);
    }
  }, [page, hostFilter, srcAddrFilter, dstAddrFilter, protocolFilter]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Flows</h1>
        <p className="text-gray-400 mt-1">Registros de trafego de rede</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={hostFilter}
            onChange={(e) => { setHostFilter(e.target.value); setPage(0); }}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Todos os hosts</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>{h.name} ({h.ipAddress})</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="IP origem..."
            value={srcAddrFilter}
            onChange={(e) => { setSrcAddrFilter(e.target.value); setPage(0); }}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="IP destino..."
            value={dstAddrFilter}
            onChange={(e) => { setDstAddrFilter(e.target.value); setPage(0); }}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <select
            value={protocolFilter}
            onChange={(e) => { setProtocolFilter(e.target.value); setPage(0); }}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Todos os protocolos</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
            <option value="GRE">GRE</option>
            <option value="ESP">ESP</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {total.toLocaleString()} registros encontrados
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            <FlowTable records={flows} showHost />

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
          </>
        )}
      </div>
    </div>
  );
}
