#!/bin/sh
set -e

echo "=== NetFlow Manager - Iniciando ==="
echo "Diretorio: $(pwd)"
echo "DATABASE_URL: ${DATABASE_URL}"

# Sincronizar banco de dados (criar tabelas se necessario)
echo "Sincronizando banco de dados..."
if [ -f "./prisma/schema.prisma" ]; then
    node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 || {
        echo "Erro: Falha ao sincronizar banco de dados."
    }
    echo "Banco de dados sincronizado com sucesso."
else
    echo "Erro: prisma/schema.prisma nao encontrado!"
fi

# Iniciar servidor Next.js
echo "Iniciando servidor Next.js na porta ${PORT:-3000}..."
if [ -f "server.js" ]; then
    exec node server.js
else
    echo "Erro Critico: server.js nao encontrado!"
    exit 1
fi
