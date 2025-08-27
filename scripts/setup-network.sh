#!/bin/bash

# Script para configurar automaticamente o IP da rede para desenvolvimento

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Detectando configuração de rede...${NC}"

# Detecta o IP da rede local
NETWORK_IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -1)

if [ -z "$NETWORK_IP" ]; then
    echo -e "${RED}❌ Não foi possível detectar o IP da rede${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IP da rede detectado: ${NETWORK_IP}${NC}"

# Cria arquivo .env.local no frontend se não existir
FRONTEND_ENV_FILE="./frontend/.env.local"

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env.local...${NC}"
    cat > "$FRONTEND_ENV_FILE" << EOF
# Configurações para desenvolvimento local
# IP detectado automaticamente: ${NETWORK_IP}
VITE_API_PORT=3001
VITE_NETWORK_IP=${NETWORK_IP}
EOF
else
    echo -e "${YELLOW}📝 Atualizando arquivo .env.local...${NC}"
    # Remove linha existente do VITE_NETWORK_IP se existir
    sed -i '/VITE_NETWORK_IP=/d' "$FRONTEND_ENV_FILE"
    # Adiciona a nova linha
    echo "VITE_NETWORK_IP=${NETWORK_IP}" >> "$FRONTEND_ENV_FILE"
fi

echo -e "${GREEN}✅ Configuração atualizada!${NC}"
echo -e "${BLUE}📋 Informações da rede:${NC}"
echo -e "   IP da rede: ${NETWORK_IP}"
echo -e "   Backend URL: http://${NETWORK_IP}:3001"
echo -e "   Frontend URL: http://${NETWORK_IP}:5173"

echo -e "${YELLOW}💡 Para acessar de outros dispositivos na rede:${NC}"
echo -e "   Frontend: http://${NETWORK_IP}:5173"
echo -e "   Backend API: http://${NETWORK_IP}:3001"

echo -e "${GREEN}🚀 Agora você pode iniciar os serviços:${NC}"
echo -e "   Backend: cd backend && npm run dev"
echo -e "   Frontend: cd frontend && npm run dev -- --host 0.0.0.0"