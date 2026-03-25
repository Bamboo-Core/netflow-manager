"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
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
  enabled: boolean;
  collecting: boolean;
  _count: { flowRecords: number };
}

interface HostCardProps {
  host: Host;
  onRefresh: () => void;
}

function getLabel(items: readonly { value: string; label: string }[], value: string): string {
  return items.find((i) => i.value === value)?.label || value;
}

export default function HostCard({ host, onRefresh }: HostCardProps) {
  const [collectLoading, setCollectLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCollect = async (action: "start" | "stop") => {
    setCollectLoading(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao gerenciar coleta");
      }
      onRefresh();
    } catch {
      alert("Erro de conexao");
    } finally {
      setCollectLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja remover o host "${host.name}"?`)) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao remover host");
      }
      onRefresh();
    } catch {
      alert("Erro de conexao");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            href={`/hosts/${host.id}`}
            className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors"
          >
            {host.name}
          </Link>
          <p className="text-gray-400 text-sm font-mono">{host.ipAddress}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge active={host.enabled} activeLabel="Habilitado" inactiveLabel="Desabilitado" />
          {host.enabled && (
            <StatusBadge
              active={host.collecting}
              activeLabel="Coletando"
              inactiveLabel="Parado"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <span className="text-gray-500">Fabricante:</span>{" "}
          <span className="text-gray-300">{getLabel(VENDORS, host.vendor)}</span>
        </div>
        <div>
          <span className="text-gray-500">Tipo:</span>{" "}
          <span className="text-gray-300">{getLabel(HOST_TYPES, host.hostType)}</span>
        </div>
        <div>
          <span className="text-gray-500">Protocolo:</span>{" "}
          <span className="text-gray-300">{getLabel(FLOW_PROTOCOLS, host.flowProtocol)}</span>
        </div>
        <div>
          <span className="text-gray-500">Porta:</span>{" "}
          <span className="text-gray-300">{host.collectorPort}</span>
        </div>
        {host.model && (
          <div className="col-span-2">
            <span className="text-gray-500">Modelo:</span>{" "}
            <span className="text-gray-300">{host.model}</span>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-gray-500">Flows registrados:</span>{" "}
          <span className="text-gray-300">{host._count.flowRecords.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-700">
        <Link
          href={`/hosts/${host.id}`}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          Detalhes
        </Link>
        <Link
          href={`/hosts/${host.id}/edit`}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          Editar
        </Link>
        {host.enabled && (
          <button
            onClick={() => handleCollect(host.collecting ? "stop" : "start")}
            disabled={collectLoading}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
              host.collecting
                ? "bg-amber-700 hover:bg-amber-600 text-white"
                : "bg-cyan-700 hover:bg-cyan-600 text-white"
            }`}
          >
            {collectLoading
              ? "..."
              : host.collecting
              ? "Parar Coleta"
              : "Iniciar Coleta"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ml-auto"
        >
          {deleteLoading ? "..." : "Remover"}
        </button>
      </div>
    </div>
  );
}
