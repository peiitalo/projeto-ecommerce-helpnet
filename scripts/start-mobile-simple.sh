#!/bin/bash

echo "🚀 Iniciando E-commerce para Acesso Mobile (Modo Simples)..."
echo "📱 Seu IP local: 192.168.0.104"
echo ""

# Verificar se PostgreSQL está rodando
if ! docker ps | grep -q postgres; then
    echo "🔄 Iniciando PostgreSQL..."
    docker run -d \
        --name ecommerce-postgres-simple \
        -e POSTGRES_DB=projeto_ecommerce_prod \
        -e POSTGRES_USER=ecommerce_user \
        -e POSTGRES_PASSWORD=ecommerce_secure_2024 \
        -p 5432:5432 \
        postgres:15-alpine
    
    echo "⏳ Aguardando PostgreSQL inicializar..."
    sleep 10
fi

# Configurar variáveis de ambiente para o backend
export NODE_ENV=production
export DATABASE_URL="postgresql://ecommerce_user:ecommerce_secure_2024@localhost:5432/projeto_ecommerce_prod"
export PORT=3001

# Configurar variáveis de ambiente para o frontend
export VITE_API_BASE_URL="http://192.168.0.104:3001"

echo "🔧 Executando migrações do banco..."
cd /home/peiitalo/projetos/projeto-ecommerce-helpnet/backend
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo "🚀 Iniciando Backend..."
cd /home/peiitalo/projetos/projeto-ecommerce-helpnet/backend
npm start &
BACKEND_PID=$!

echo "⏳ Aguardando backend inicializar..."
sleep 5

echo "🚀 Iniciando Frontend..."
cd /home/peiitalo/projetos/projeto-ecommerce-helpnet/frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📱 Acesse pelo seu celular:"
echo "   Frontend: http://192.168.0.104:5173"
echo "   Backend API: http://192.168.0.104:3001"
echo ""
echo "💻 Acesse pelo computador:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001'''"
echo ""
echo "🛑 Para parar o sistema, pressione Ctrl+C"
echo ""

# Aguardar interrupção
trap "echo '🛑 Parando serviços...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Manter o script rodando
wait