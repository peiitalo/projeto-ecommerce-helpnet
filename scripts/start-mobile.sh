#!/bin/bash

echo "🚀 Iniciando E-commerce para Acesso Mobile..."
echo "📱 Seu IP local: 192.168.0.104"
echo ""

# Parar containers existentes se houver
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.mobile.yml down

# Limpar volumes antigos se necessário (descomente se quiser reset completo)
# docker volume rm projeto-ecommerce-helpnet_postgres_mobile_data 2>/dev/null || true

echo "🔨 Construindo e iniciando containers..."
docker-compose -f docker-compose.mobile.yml up --build -d

echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📱 Acesse pelo seu celular:"
echo "   Frontend: http://192.168.0.104:5173"
echo "   Backend API: http://192.168.0.104:3001"
echo ""
echo "💻 Acesse pelo computador:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo ""
echo "📊 Para ver os logs:"
echo "   docker-compose -f docker-compose.mobile.yml logs -f"
echo ""
echo "🛑 Para parar:"
echo "   docker-compose -f docker-compose.mobile.yml down"