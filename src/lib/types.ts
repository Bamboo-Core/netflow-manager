export const VENDORS = [
  { value: "cisco", label: "Cisco" },
  { value: "huawei", label: "Huawei" },
  { value: "juniper", label: "Juniper" },
  { value: "mikrotik", label: "MikroTik" },
  { value: "nokia", label: "Nokia" },
  { value: "arista", label: "Arista" },
  { value: "other", label: "Outro" },
] as const;

export const HOST_TYPES = [
  { value: "border_router", label: "Roteador de Borda" },
  { value: "core_router", label: "Roteador Core" },
  { value: "core_switch", label: "Switch Core" },
  { value: "distribution_switch", label: "Switch de Distribuicao" },
  { value: "access_switch", label: "Switch de Acesso" },
  { value: "firewall", label: "Firewall" },
  { value: "load_balancer", label: "Load Balancer" },
  { value: "other", label: "Outro" },
] as const;

export const FLOW_PROTOCOLS = [
  { value: "netflow_v5", label: "NetFlow v5" },
  { value: "netflow_v9", label: "NetFlow v9" },
  { value: "ipfix", label: "IPFIX" },
  { value: "netstream", label: "NetStream (Huawei)" },
  { value: "sflow", label: "sFlow" },
] as const;

export interface HostFormData {
  name: string;
  ipAddress: string;
  vendor: string;
  model: string;
  hostType: string;
  flowProtocol: string;
  collectorPort: number;
  description: string;
  enabled: boolean;
}

export interface FlowQueryParams {
  hostId?: string;
  startDate?: string;
  endDate?: string;
  srcAddr?: string;
  dstAddr?: string;
  protocol?: string;
  limit?: number;
  offset?: number;
}

export interface FlowSummary {
  totalBytes: number;
  totalPackets: number;
  totalFlows: number;
  topSources: { addr: string; bytes: number }[];
  topDestinations: { addr: string; bytes: number }[];
  protocolDistribution: { protocol: string; bytes: number; packets: number }[];
  trafficOverTime: { time: string; bytes: number; packets: number }[];
}
