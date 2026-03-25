import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const hostId = searchParams.get("hostId");
  const srcAddr = searchParams.get("srcAddr");
  const dstAddr = searchParams.get("dstAddr");
  const protocol = searchParams.get("protocol");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};

  if (hostId) where.hostId = hostId;
  if (srcAddr) where.srcAddr = { contains: srcAddr };
  if (dstAddr) where.dstAddr = { contains: dstAddr };
  if (protocol) where.protocol = protocol;

  if (startDate || endDate) {
    const timestampFilter: Record<string, Date> = {};
    if (startDate) timestampFilter.gte = new Date(startDate);
    if (endDate) timestampFilter.lte = new Date(endDate);
    where.timestamp = timestampFilter;
  }

  const [records, total] = await Promise.all([
    prisma.flowRecord.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: {
        host: {
          select: { name: true, ipAddress: true },
        },
      },
    }),
    prisma.flowRecord.count({ where }),
  ]);

  const serializedRecords = records.map((r) => ({
    ...r,
    bytes: r.bytes.toString(),
    packets: r.packets.toString(),
  }));

  return NextResponse.json({
    records: serializedRecords,
    total,
    limit,
    offset,
  });
}
