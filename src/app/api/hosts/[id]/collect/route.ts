import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startNfcapd, stopNfcapd, checkNfdumpInstalled } from "@/lib/nfdump";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (!action || !["start", "stop"].includes(action)) {
      return NextResponse.json(
        { error: "Acao invalida. Use 'start' ou 'stop'" },
        { status: 400 }
      );
    }

    const host = await prisma.host.findUnique({ where: { id } });
    if (!host) {
      return NextResponse.json({ error: "Host nao encontrado" }, { status: 404 });
    }

    if (!host.enabled) {
      return NextResponse.json(
        { error: "Host esta desabilitado" },
        { status: 400 }
      );
    }

    const nfdumpInstalled = await checkNfdumpInstalled();
    if (!nfdumpInstalled) {
      return NextResponse.json(
        {
          error: "nfdump/nfcapd nao esta instalado no servidor. Instale com: apt-get install nfdump",
          nfdumpInstalled: false,
        },
        { status: 503 }
      );
    }

    if (action === "start") {
      if (host.collecting) {
        return NextResponse.json({ message: "Coleta ja esta ativa", collecting: true });
      }

      const result = await startNfcapd(host.id, host.collectorPort, host.ipAddress);

      if (result.success) {
        await prisma.host.update({
          where: { id },
          data: { collecting: true, nfcapdPid: result.pid },
        });

        return NextResponse.json({
          message: "Coleta iniciada com sucesso",
          collecting: true,
          pid: result.pid,
        });
      } else {
        return NextResponse.json(
          { error: result.error || "Falha ao iniciar coleta" },
          { status: 500 }
        );
      }
    } else {
      if (!host.collecting) {
        return NextResponse.json({ message: "Coleta ja esta parada", collecting: false });
      }

      await stopNfcapd(host.id);

      await prisma.host.update({
        where: { id },
        data: { collecting: false, nfcapdPid: null },
      });

      return NextResponse.json({
        message: "Coleta parada com sucesso",
        collecting: false,
      });
    }
  } catch (error) {
    console.error("Error managing collection:", error);
    return NextResponse.json(
      { error: "Erro ao gerenciar coleta" },
      { status: 500 }
    );
  }
}
