#!/bin/bash

# Script para parar o projeto E-commerce Docker

echo "🛑 Parando Projeto E-commerce Docker..."
echo "======================================"

# Parar e remover containers
echo "📦 Parando containers..."
docker-compose down

echo ""
echo "📊 Status final:"
docker-compose ps

echo ""
echo "✅ Projeto parado com sucesso!"
echo ""
echo "💡 Opções adicionais:"
echo "   Parar e limpar volumes:  docker-compose down -v"
echo "   Limpar sistema Docker:   docker system prune -f"
echo "   Reiniciar projeto:       ./start-docker.sh"