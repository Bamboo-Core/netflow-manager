"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import HostForm from "@/components/HostForm";

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
}

export default function EditHostPage() {
  const params = useParams();
  const hostId = params.id as string;

  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHost() {
      try {
        const res = await fetch(`/api/hosts/${hostId}`);
        if (res.ok) {
          const data = await res.json();
          setHost(data);
        }
      } catch (err) {
        console.error("Error fetching host:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHost();
  }, [hostId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white mb-2">Host nao encontrado</h2>
          <Link href="/hosts" className="text-cyan-400 hover:underline">
            Voltar para lista de hosts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Editar Host</h1>
        <p className="text-gray-400 mt-1">{host.name} - {host.ipAddress}</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <HostForm
          initialData={{
            id: host.id,
            name: host.name,
            ipAddress: host.ipAddress,
            vendor: host.vendor,
            model: host.model || "",
            hostType: host.hostType,
            flowProtocol: host.flowProtocol,
            collectorPort: host.collectorPort,
            description: host.description || "",
            enabled: host.enabled,
          }}
          isEditing
        />
      </div>
    </div>
  );
}
