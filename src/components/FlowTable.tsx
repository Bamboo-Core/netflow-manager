"use client";

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

interface FlowTableProps {
  records: FlowRecord[];
  showHost?: boolean;
}

function formatBytes(bytesStr: string): string {
  const bytes = parseInt(bytesStr, 10);
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FlowTable({ records, showHost = false }: FlowTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>Nenhum registro de flow encontrado</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="pb-3 pr-4">Timestamp</th>
            {showHost && <th className="pb-3 pr-4">Host</th>}
            <th className="pb-3 pr-4">Origem</th>
            <th className="pb-3 pr-4">Destino</th>
            <th className="pb-3 pr-4">Protocolo</th>
            <th className="pb-3 pr-4 text-right">Bytes</th>
            <th className="pb-3 text-right">Pacotes</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {records.map((record) => (
            <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-2 pr-4 text-xs text-gray-400">
                {new Date(record.timestamp).toLocaleString("pt-BR")}
              </td>
              {showHost && record.host && (
                <td className="py-2 pr-4">
                  <span className="text-cyan-400">{record.host.name}</span>
                </td>
              )}
              <td className="py-2 pr-4 font-mono text-xs">
                {record.srcAddr}:{record.srcPort}
              </td>
              <td className="py-2 pr-4 font-mono text-xs">
                {record.dstAddr}:{record.dstPort}
              </td>
              <td className="py-2 pr-4">
                <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">
                  {record.protocol}
                </span>
              </td>
              <td className="py-2 pr-4 text-right font-mono text-xs">
                {formatBytes(record.bytes)}
              </td>
              <td className="py-2 text-right font-mono text-xs">
                {parseInt(record.packets, 10).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
