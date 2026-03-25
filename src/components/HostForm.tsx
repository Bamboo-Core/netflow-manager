"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VENDORS, HOST_TYPES, FLOW_PROTOCOLS } from "@/lib/types";
import type { HostFormData } from "@/lib/types";

interface HostFormProps {
  initialData?: HostFormData & { id?: string };
  isEditing?: boolean;
}

export default function HostForm({ initialData, isEditing = false }: HostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<HostFormData>({
    name: initialData?.name || "",
    ipAddress: initialData?.ipAddress || "",
    vendor: initialData?.vendor || "cisco",
    model: initialData?.model || "",
    hostType: initialData?.hostType || "border_router",
    flowProtocol: initialData?.flowProtocol || "netflow_v5",
    collectorPort: initialData?.collectorPort || 9995,
    description: initialData?.description || "",
    enabled: initialData?.enabled !== undefined ? initialData.enabled : true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : 
              type === "number" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/hosts/${initialData?.id}`
        : "/api/hosts";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar host");
      }

      router.push("/hosts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: Router Borda SP"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Endereco IP *
          </label>
          <input
            type="text"
            name="ipAddress"
            value={formData.ipAddress}
            onChange={handleChange}
            required
            placeholder="Ex: 10.0.0.1"
            pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            title="Insira um endereco IPv4 valido"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Fabricante *
          </label>
          <select
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {VENDORS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Modelo
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Ex: ASR 9000, NE40E"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tipo *
          </label>
          <select
            name="hostType"
            value={formData.hostType}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {HOST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Protocolo de Flow *
          </label>
          <select
            name="flowProtocol"
            value={formData.flowProtocol}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {FLOW_PROTOCOLS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Porta do Coletor
          </label>
          <input
            type="number"
            name="collectorPort"
            value={formData.collectorPort}
            onChange={handleChange}
            min={1024}
            max={65535}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            id="enabled"
            className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-500"
          />
          <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
            Host habilitado
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descricao
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Descricao do equipamento..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {loading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
