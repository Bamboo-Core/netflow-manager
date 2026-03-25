import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  const host = await prisma.host.findUnique({ where: { id } });
  if (!host) {
    return NextResponse.json({ error: "Host nao encontrado" }, { status: 404 });
  }

  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const srcAddr = searchParams.get("srcAddr");
  const dstAddr = searchParams.get("dstAddr");
  const protocol = searchParams.get("protocol");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = { hostId: id };

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
