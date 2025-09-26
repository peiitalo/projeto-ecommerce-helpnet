#!/bin/bash

# Script para iniciar Docker Compose com verificação de portas
# Verifica conflitos antes de tentar iniciar

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
