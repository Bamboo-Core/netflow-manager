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

# Verificar nfdump/nfcapd
echo "Verificando instalacao do nfdump..."
if command -v nfcapd > /dev/null 2>&1 && command -v nfdump > /dev/null 2>&1; then
    NFCAPD_VERSION=$(nfcapd -V 2>&1 | head -1 || echo "desconhecida")
    echo "nfdump instalado com sucesso: ${NFCAPD_VERSION}"
else
    echo "AVISO: nfdump/nfcapd NAO encontrado no PATH!"
    echo "A coleta de NetFlow nao funcionara."
fi

# Criar diretorio de dados do nfcapd se nao existir
DATA_DIR="${NFCAPD_DATA_DIR:-/var/lib/nfcapd-data}"
echo "Diretorio de dados nfcapd: ${DATA_DIR}"
mkdir -p "${DATA_DIR}" || echo "Aviso: Nao foi possivel criar ${DATA_DIR}"

# Sincronizar banco de dados (criar tabelas se necessario)
echo "Sincronizando banco de dados..."
if [ -f "./prisma/schema.prisma" ]; then
    node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 && \
        echo "Banco de dados sincronizado com sucesso." || \
        echo "Erro: Falha ao sincronizar banco de dados."
else
    echo "Erro: prisma/schema.prisma nao encontrado!"
fi

# Resetar status de coleta de todos os hosts (os processos nfcapd nao sobrevivem restart do container)
echo "Resetando status de coleta dos hosts..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.host.updateMany({
  where: { collecting: true },
  data: { collecting: false, nfcapdPid: null }
}).then(r => {
  console.log('Hosts resetados: ' + r.count);
  return prisma.\$disconnect();
}).catch(e => {
  console.error('Aviso: Falha ao resetar hosts:', e.message);
  return prisma.\$disconnect();
});
" 2>&1 || echo "Aviso: Nao foi possivel resetar status dos hosts."

# Iniciar servidor Next.js
echo "Iniciando servidor Next.js na porta ${PORT:-3000}..."
if [ -f "server.js" ]; then
    exec node server.js
else
    echo "Erro Critico: server.js nao encontrado!"
    exit 1
fi
