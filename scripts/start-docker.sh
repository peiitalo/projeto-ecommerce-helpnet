#!/bin/bash

# Script para inicializar o projeto E-commerce com Docker

echo "🐳 Iniciando Projeto E-commerce com Docker..."
echo "================================================"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se as portas estão disponíveis
echo "🔍 Verificando portas disponíveis..."

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Porta $1 já está em uso. Por favor, libere a porta antes de continuar."
        echo "   Para ver o processo: sudo lsof -i :$1"
        echo "   Para matar o processo: sudo kill -9 \$(sudo lsof -t -i:$1)"
        return 1
    else
        echo "✅ Porta $1 disponível"
        return 0
    fi
}

# Verificar portas necessárias
ports_ok=true
check_port 3001 || ports_ok=false
check_port 5173 || ports_ok=false
check_port 5432 || ports_ok=false

if [ "$ports_ok" = false ]; then
    echo ""
    echo "❌ Algumas portas não estão disponíveis. Resolva os conflitos antes de continuar."
    exit 1
fi

echo ""
echo "🚀 Iniciando containers..."
echo "   - PostgreSQL (porta 5432)"
echo "   - Backend API (porta 3001)" 
echo "   - Frontend React (porta 5173)"
echo ""

# Construir e iniciar os containers
docker-compose up --build -d

# Aguardar um pouco para os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos containers
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "🎉 Projeto iniciado com sucesso!"
echo ""
echo "📱 Acesse a aplicação:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🛠️  Comandos úteis:"
echo "   Ver logs:        docker-compose logs -f"
echo "   Parar projeto:   docker-compose down"
echo "   Reiniciar:       docker-compose restart"
echo ""
echo "📖 Para mais informações, consulte README-DOCKER.md"