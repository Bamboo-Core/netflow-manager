import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hostId = searchParams.get("hostId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (hostId) where.hostId = hostId;

  if (startDate || endDate) {
    const timestampFilter: Record<string, Date> = {};
    if (startDate) timestampFilter.gte = new Date(startDate);
    if (endDate) timestampFilter.lte = new Date(endDate);
    where.timestamp = timestampFilter;
  }

  const allRecords = await prisma.flowRecord.findMany({
    where,
    select: {
      srcAddr: true,
      dstAddr: true,
      protocol: true,
      bytes: true,
      packets: true,
      timestamp: true,
    },
  });

  let totalBytes = BigInt(0);
  let totalPackets = BigInt(0);
  const totalFlows = allRecords.length;

  const srcMap = new Map<string, bigint>();
  const dstMap = new Map<string, bigint>();
  const protoMap = new Map<string, { bytes: bigint; packets: bigint }>();
  const timeMap = new Map<string, { bytes: bigint; packets: bigint }>();

  for (const record of allRecords) {
    totalBytes += record.bytes;
    totalPackets += record.packets;

    srcMap.set(record.srcAddr, (srcMap.get(record.srcAddr) || BigInt(0)) + record.bytes);
    dstMap.set(record.dstAddr, (dstMap.get(record.dstAddr) || BigInt(0)) + record.bytes);

    const existing = protoMap.get(record.protocol) || { bytes: BigInt(0), packets: BigInt(0) };
    protoMap.set(record.protocol, {
      bytes: existing.bytes + record.bytes,
      packets: existing.packets + record.packets,
    });

    const timeKey = new Date(record.timestamp).toISOString().slice(0, 13) + ":00:00.000Z";
    const timeExisting = timeMap.get(timeKey) || { bytes: BigInt(0), packets: BigInt(0) };
    timeMap.set(timeKey, {
      bytes: timeExisting.bytes + record.bytes,
      packets: timeExisting.packets + record.packets,
    });
  }

  const topSources = Array.from(srcMap.entries())
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, 10)
    .map(([addr, bytes]) => ({ addr, bytes: Number(bytes) }));

  const topDestinations = Array.from(dstMap.entries())
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, 10)
    .map(([addr, bytes]) => ({ addr, bytes: Number(bytes) }));

  const protocolDistribution = Array.from(protoMap.entries())
    .sort((a, b) => (b[1].bytes > a[1].bytes ? 1 : -1))
    .map(([protocol, data]) => ({
      protocol,
      bytes: Number(data.bytes),
      packets: Number(data.packets),
    }));

  const trafficOverTime = Array.from(timeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, data]) => ({
      time,
      bytes: Number(data.bytes),
      packets: Number(data.packets),
    }));

  return NextResponse.json({
    totalBytes: Number(totalBytes),
    totalPackets: Number(totalPackets),
    totalFlows,
    topSources,
    topDestinations,
    protocolDistribution,
    trafficOverTime,
  });
}
