#!/bin/bash

echo "🛑 Parando E-commerce Mobile..."

# Parar containers
docker-compose -f docker-compose.mobile.yml down

echo "✅ Sistema mobile parado com sucesso!"
echo ""
echo "💡 Para reiniciar, execute: ./start-mobile.sh"