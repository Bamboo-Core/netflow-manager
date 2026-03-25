import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

const NFCAPD_BASE_DIR = process.env.NFCAPD_DATA_DIR || "/tmp/nfcapd-data";

interface NfcapdProcess {
  pid: number;
  process: ChildProcess;
  hostId: string;
  port: number;
}

const activeCollectors: Map<string, NfcapdProcess> = new Map();

export async function checkNfdumpInstalled(): Promise<boolean> {
  try {
    await execAsync("which nfcapd && which nfdump");
    return true;
  } catch {
    return false;
  }
}

export function getHostDataDir(hostId: string): string {
  return path.join(NFCAPD_BASE_DIR, hostId);
}

export async function startNfcapd(
  hostId: string,
  port: number,
  sourceIp: string
): Promise<{ pid: number; success: boolean; error?: string }> {
  const dataDir = getHostDataDir(hostId);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (activeCollectors.has(hostId)) {
    return {
      pid: activeCollectors.get(hostId)!.pid,
      success: true,
    };
  }

  try {
    const nfcapd = spawn(
      "nfcapd",
      ["-w", "-D", "-p", String(port), "-l", dataDir, "-S", "1", "-P", path.join(dataDir, "nfcapd.pid")],
      {
        detached: true,
        stdio: "ignore",
      }
    );

    nfcapd.unref();

    const pid = nfcapd.pid || 0;

    activeCollectors.set(hostId, {
      pid,
      process: nfcapd,
      hostId,
      port,
    });

    return { pid, success: true };
  } catch (error) {
    return {
      pid: 0,
      success: false,
      error: error instanceof Error ? error.message : "Failed to start nfcapd",
    };
  }
}

export async function stopNfcapd(hostId: string): Promise<boolean> {
  const collector = activeCollectors.get(hostId);

  if (collector) {
    try {
      process.kill(collector.pid, "SIGTERM");
    } catch {
      // Process may already be gone
    }
    activeCollectors.delete(hostId);
    return true;
  }

  const dataDir = getHostDataDir(hostId);
  const pidFile = path.join(dataDir, "nfcapd.pid");

  if (fs.existsSync(pidFile)) {
    try {
      const pid = parseInt(fs.readFileSync(pidFile, "utf-8").trim(), 10);
      process.kill(pid, "SIGTERM");
      fs.unlinkSync(pidFile);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export interface ParsedFlowRecord {
  timestamp: Date;
  srcAddr: string;
  dstAddr: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  bytes: bigint;
  packets: bigint;
  flows: number;
}

export async function readFlowData(
  hostId: string,
  startTime?: Date,
  endTime?: Date
): Promise<ParsedFlowRecord[]> {
  const dataDir = getHostDataDir(hostId);

  if (!fs.existsSync(dataDir)) {
    return [];
  }

  let cmd = `nfdump -R ${dataDir} -o csv -q`;

  if (startTime) {
    const start = formatNfdumpTime(startTime);
    cmd += ` -t ${start}`;
    if (endTime) {
      const end = formatNfdumpTime(endTime);
      cmd += `-${end}`;
    }
  }

  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
    return parseNfdumpCsv(stdout);
  } catch {
    return [];
  }
}

function formatNfdumpTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${d}.${h}:${min}:${s}`;
}

function parseNfdumpCsv(csvOutput: string): ParsedFlowRecord[] {
  const lines = csvOutput.trim().split("\n");
  const records: ParsedFlowRecord[] = [];

  for (const line of lines) {
    if (!line || line.startsWith("Date") || line.startsWith("Summary")) {
      continue;
    }

    const fields = line.split(",");
    if (fields.length < 9) continue;

    try {
      const dateStr = fields[0]?.trim();
      const timestamp = dateStr ? new Date(dateStr) : new Date();

      if (isNaN(timestamp.getTime())) continue;

      records.push({
        timestamp,
        srcAddr: fields[3]?.trim() || "0.0.0.0",
        srcPort: parseInt(fields[4]?.trim() || "0", 10),
        dstAddr: fields[5]?.trim() || "0.0.0.0",
        dstPort: parseInt(fields[6]?.trim() || "0", 10),
        protocol: fields[7]?.trim() || "unknown",
        bytes: BigInt(fields[11]?.trim() || "0"),
        packets: BigInt(fields[10]?.trim() || "0"),
        flows: parseInt(fields[9]?.trim() || "1", 10),
      });
    } catch {
      continue;
    }
  }

  return records;
}

export async function getNfdumpSummary(
  hostId: string,
  startTime?: Date,
  endTime?: Date
): Promise<string> {
  const dataDir = getHostDataDir(hostId);

  if (!fs.existsSync(dataDir)) {
    return "No data available";
  }

  let cmd = `nfdump -R ${dataDir} -s srcip/bytes -n 10 -q`;

  if (startTime) {
    const start = formatNfdumpTime(startTime);
    cmd += ` -t ${start}`;
    if (endTime) {
      const end = formatNfdumpTime(endTime);
      cmd += `-${end}`;
    }
  }

  try {
    const { stdout } = await execAsync(cmd);
    return stdout;
  } catch {
    return "Error reading flow data";
  }
}
