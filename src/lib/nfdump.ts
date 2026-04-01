export async function startNfcapd(
  hostId: string,
  port: number,
  sourceIp?: string
): Promise<{ pid: number; success: boolean; error?: string }> {

  console.log(`[DEBUG NFCAPD] Iniciando para hostId=${hostId}, porta=${port}`);

  const dataDir = getHostDataDir(hostId);
  const pidFile = path.join(dataDir, "nfcapd.pid");

  console.log(`[DEBUG NFCAPD] Diretório alvo: ${dataDir}`);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`[DEBUG NFCAPD] Diretório criado`);
  }

  const args: string[] = ["-D", "-p", String(port), "-w", dataDir, "-S", "1", "-P", pidFile];
  if (sourceIp) args.push("-b", sourceIp);

  console.log(`[DEBUG NFCAPD] Comando: nfcapd ${args.join(" ")}`);

  try {
    const nfcapd = spawn("nfcapd", args, {
      detached: true,
      stdio: "ignore",
    });

    nfcapd.unref();

    console.log(`[DEBUG NFCAPD] Spawn executado com sucesso. PID do spawn: ${nfcapd.pid}`);

    await new Promise(r => setTimeout(r, 1500));

    let realPid = 0;
    if (fs.existsSync(pidFile)) {
      const content = fs.readFileSync(pidFile, "utf-8").trim();
      realPid = parseInt(content, 10);
      console.log(`[DEBUG NFCAPD] PID lido do arquivo: ${realPid}`);
    } else {
      console.error(`[DEBUG NFCAPD] ERRO: Arquivo PID não foi criado em ${pidFile}`);
    }

    if (realPid > 0) {
      activeCollectors.set(hostId, { pid: realPid, process: nfcapd, hostId, port });

      nfcapd.on("exit", (code, signal) => {
        console.error(`[DEBUG NFCAPD] Processo morreu! Host=${hostId} Code=${code} Signal=${signal}`);
        activeCollectors.delete(hostId);
      });

      console.log(`✅ [DEBUG NFCAPD] SUCESSO - nfcapd rodando com PID ${realPid}`);
      return { pid: realPid, success: true };
    } else {
      return { pid: 0, success: false, error: "PID não foi criado" };
    }
  } catch (error: any) {
    console.error(`[DEBUG NFCAPD] ERRO CRÍTICO no spawn:`, error.message);
    console.error(error.stack);
    return { pid: 0, success: false, error: error.message };
  }
}
