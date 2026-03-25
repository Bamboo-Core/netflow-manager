-- CreateTable
CREATE TABLE "hosts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "model" TEXT,
    "hostType" TEXT NOT NULL,
    "flowProtocol" TEXT NOT NULL,
    "collectorPort" INTEGER NOT NULL DEFAULT 9995,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "collecting" BOOLEAN NOT NULL DEFAULT false,
    "nfcapdPid" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "flow_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "srcAddr" TEXT NOT NULL,
    "dstAddr" TEXT NOT NULL,
    "srcPort" INTEGER NOT NULL,
    "dstPort" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "packets" BIGINT NOT NULL,
    "flows" INTEGER NOT NULL DEFAULT 1,
    "inputIf" INTEGER,
    "outputIf" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flow_records_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "hosts_ipAddress_key" ON "hosts"("ipAddress");

-- CreateIndex
CREATE INDEX "flow_records_hostId_idx" ON "flow_records"("hostId");

-- CreateIndex
CREATE INDEX "flow_records_timestamp_idx" ON "flow_records"("timestamp");

-- CreateIndex
CREATE INDEX "flow_records_srcAddr_idx" ON "flow_records"("srcAddr");

-- CreateIndex
CREATE INDEX "flow_records_dstAddr_idx" ON "flow_records"("dstAddr");
