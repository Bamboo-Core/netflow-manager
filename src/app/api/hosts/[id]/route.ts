import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const host = await prisma.host.findUnique({
    where: { id },
    include: {
      _count: {
        select: { flowRecords: true },
      },
    },
  });

  if (!host) {
    return NextResponse.json({ error: "Host nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(host);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const existing = await prisma.host.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Host nao encontrado" }, { status: 404 });
    }

    if (body.ipAddress && body.ipAddress !== existing.ipAddress) {
      const duplicate = await prisma.host.findUnique({
        where: { ipAddress: body.ipAddress },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Ja existe um host com este endereco IP" },
          { status: 409 }
        );
      }
    }

    const host = await prisma.host.update({
      where: { id },
      data: {
        name: body.name,
        ipAddress: body.ipAddress,
        vendor: body.vendor,
        model: body.model,
        hostType: body.hostType,
        flowProtocol: body.flowProtocol,
        collectorPort: body.collectorPort,
        description: body.description,
        enabled: body.enabled,
      },
    });

    return NextResponse.json(host);
  } catch (error) {
    console.error("Error updating host:", error);
    return NextResponse.json({ error: "Erro ao atualizar host" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.host.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Host nao encontrado" }, { status: 404 });
    }

    await prisma.host.delete({ where: { id } });

    return NextResponse.json({ message: "Host removido com sucesso" });
  } catch (error) {
    console.error("Error deleting host:", error);
    return NextResponse.json({ error: "Erro ao remover host" }, { status: 500 });
  }
}
