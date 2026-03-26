# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies without running postinstall (no DB needed at this stage)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npm ci --ignore-scripts && npm cache clean --force

# Generate Prisma Client (needs schema but not a real DB connection)
RUN npx prisma generate

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npm run build

# ---- Stage 3: Runner (Production) ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# PostgreSQL connection - set via EasyPanel environment variables
# Example: postgresql://postgres:password@flow-test-db:5432/flow-test-db
ENV DATABASE_URL=""

# Diretorio de dados do nfcapd (pode ser sobrescrito via env)
ENV NFCAPD_DATA_DIR="/var/lib/nfcapd-data"

# Install runtime dependencies: openssl para Prisma, nfdump para coleta NetFlow
RUN apk add --no-cache openssl nfdump

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# Criar e dar permissao ao diretorio de dados do nfcapd
RUN mkdir -p /var/lib/nfcapd-data && \
  chown -R nextjs:nodejs /var/lib/nfcapd-data

# Copy standalone build output from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + client for runtime db push
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy startup script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x start.sh


USER nextjs

# Porta HTTP do Next.js
EXPOSE 3000

# Porta UDP padrao do NetFlow/nfcapd (pode variar por host)
# O EasyPanel deve expor esta porta como UDP no servico
EXPOSE 9995/udp

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["sh", "start.sh"]
