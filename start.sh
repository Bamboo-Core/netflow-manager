#!/bin/sh
set -e

echo "Starting netflow-manager Next.js container..."
    
# Executa as migrações
echo "Sincronizando banco de dados através do Prisma..."
npx --yes prisma generate --schema=./prisma/schema.prisma
npx --yes prisma db push --schema=./prisma/schema.prisma --accept-data-loss || echo "Aviso: Nao foi possivel sincronizar o banco via Prisma."

echo "Iniciando servidor Next.js..."
exec node server.js
