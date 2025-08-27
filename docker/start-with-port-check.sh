#!/bin/bash

# Script para iniciar Docker Compose com verificação de portas
# Verifica conflitos antes de tentar iniciar

echo "🔍 Verificando conflitos de porta..."

# Verificar porta 5432 ou 5433
if grep -q "5433:5432" docker-compose.yml; then
    PORT_TO_CHECK="5433"
    echo "Configurado para usar porta 5433"
else
    PORT_TO_CHECK="5432"
    echo "Configurado para usar porta 5432"
fi

if netstat -tlnp 2>/dev/null | grep -q ":$PORT_TO_CHECK "; then
    echo "❌ Porta $PORT_TO_CHECK está em uso!"
    echo "Execute: ../scripts/fix-docker.sh"
    exit 1
fi

echo "✅ Portas livres, iniciando containers..."

# Usar o comando correto do docker-compose
if command -v docker-compose &>/dev/null; then
    docker-compose up -d
elif docker compose version &>/dev/null; then
    docker compose up -d
else
    echo "❌ Nenhuma versão do Docker Compose encontrada!"
    exit 1
fi

echo ""
echo "📊 Status:"
if command -v docker-compose &>/dev/null; then
    docker-compose ps
else
    docker compose ps
fi
