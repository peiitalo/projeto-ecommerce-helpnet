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
    echo "Execute: ./scripts/fix-port-conflict.sh"
    exit 1
fi

echo "✅ Portas livres, iniciando containers..."
docker-compose up -d

echo ""
echo "📊 Status:"
docker-compose ps
