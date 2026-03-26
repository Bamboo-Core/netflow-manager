#!/bin/sh
set -e

echo "=== NetFlow Manager - Iniciando ==="
echo "Diretorio: $(pwd)"

# Verificar DATABASE_URL
if [ -z "${DATABASE_URL}" ]; then
    echo "Erro Critico: DATABASE_URL nao configurada!"
    echo "Configure a variavel de ambiente DATABASE_URL com a connection string do PostgreSQL."
    echo "Exemplo: postgresql://postgres:senha@host:5432/database"
    exit 1
fi
echo "DATABASE_URL: configurada (PostgreSQL)"

# Sincronizar banco de dados (criar tabelas se necessario)
echo "Sincronizando banco de dados..."
if [ -f "./prisma/schema.prisma" ]; then
    node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 && \
        echo "Banco de dados sincronizado com sucesso." || \
        echo "Erro: Falha ao sincronizar banco de dados."
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
