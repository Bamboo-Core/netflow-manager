# Usa Node.js 20 em Alpine Linux como base
FROM node:20-alpine AS base

# 1. Instalar dependências necessárias
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
ENV DATABASE_URL="file:/dev.db"

RUN npm ci

# 2. Build da aplicação
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build
ENV NEXT_TELEMETRY_DISABLED=1

# Gerar o Prisma Client (necessário antes do build)
RUN npx prisma generate

# Fazer o build do Next.js
RUN npm run build

# 3. Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instalar openssl para o Prisma funcionar em Alpine e dependências sqlite
RUN apk add --no-cache openssl sqlite

# Criar usuário sem privilégios de root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar diretório público
COPY --from=builder /app/public ./public

# Criar diretório para o banco de dados e dar permissão
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Configurar pastas do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar os arquivos em standalone (trabalha com next.config.ts output: "standalone")
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar a pasta prisma para ter o esquema e aplicar migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Mudar para o usuário nextjs
USER nextjs

EXPOSE 3000

# Criar script de inicialização para rodar migrations do Prisma antes de subir o servidor
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

# Variável de ambiente padrão para o banco de dados (recomenda-se sobrescrever no Easypanel)
ENV DATABASE_URL="file:/dev.db"

CMD ["./start.sh"]
