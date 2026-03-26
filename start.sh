#!/bin/sh
set -e

echo "Starting netflow-manager Next.js container..."
echo "Current directory: $(pwd)"

echo "Sincronizando banco de dados através do Prisma..."
if [ -f "./prisma/schema.prisma" ]; then
    echo "Executando 'prisma db push' para garantir as tabelas..."
    npx --yes prisma db push --schema=./prisma/schema.prisma --accept-data-loss || echo "Aviso: Nao foi possivel sincronizar o banco via Prisma."
else
    echo "Erro: Arquivo ./prisma/schema.prisma nao encontrado!"
fi

echo "Iniciando servidor Next.js..."
if [ -f "server.js" ]; then
    exec node server.js
else
    echo "Erro Critico: server.js nao encontrado!"
    exit 1
fi
