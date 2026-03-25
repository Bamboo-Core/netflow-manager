#!/bin/sh
set -e

echo "Starting netflow-manager Next.js container..."

# Executa as migrações (ou db push, como é um setup inicial Prisma sem explicit migrations ainda em env SQLite)
echo "Sincronizando banco de dados através do Prisma..."
npx --yes prisma db push --schema=./prisma/schema.prisma --accept-data-loss || echo "Aviso: Nao foi possivel sincronizar o banco via Prisma."

echo "Iniciando servidor Next.js..."
exec node server.js
