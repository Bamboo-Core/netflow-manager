import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const vendor = searchParams.get("vendor") || "";
  const hostType = searchParams.get("hostType") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (vendor) {
    where.vendor = vendor;
  }

  if (hostType) {
    where.hostType = hostType;
  }

  const hosts = await prisma.host.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { flowRecords: true },
      },
    },
  });

  return NextResponse.json(hosts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, ipAddress, vendor, model, hostType, flowProtocol, collectorPort, description, enabled } = body;

    if (!name || !ipAddress || !vendor || !hostType || !flowProtocol) {
      return NextResponse.json(
        { error: "Campos obrigatorios: name, ipAddress, vendor, hostType, flowProtocol" },
        { status: 400 }
      );
    }

    const existing = await prisma.host.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ja existe um host com este endereco IP" },
        { status: 409 }
      );
    }

    const host = await prisma.host.create({
      data: {
        name,
        ipAddress,
        vendor,
        model: model || null,
        hostType,
        flowProtocol,
        collectorPort: collectorPort || 9995,
        description: description || null,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json(host, { status: 201 });
  } catch (error) {
    console.error("Error creating host:", error);
    return NextResponse.json(
      { error: "Erro ao criar host" },
      { status: 500 }
    );
  }
}
