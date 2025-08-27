#!/bin/bash

# Script para resolver conflito de porta 3001 (Backend)
# Identifica o que está usando a porta e oferece soluções

set -e

echo "🔧 Resolução de Conflito de Porta 3001 (Backend)"
echo "==============================================="

# Função para verificar porta 3001
check_port_3001() {
    echo "🔍 Verificando porta 3001..."
    
    local port_in_use=0
    
    # Método 1: lsof
    if sudo lsof -i :3001 >/dev/null 2>&1; then
        echo "❌ Porta 3001 em uso (detectado via lsof):"
        sudo lsof -i :3001
        port_in_use=1
    fi
    
    # Método 2: ss
    if command -v ss >/dev/null 2>&1; then
        if ss -tlnp 2>/dev/null | grep -q ":3001 "; then
            echo "❌ Porta 3001 em uso (detectado via ss):"
            ss -tlnp 2>/dev/null | grep ":3001 "
            port_in_use=1
        fi
    fi
    
    # Método 3: Verificar se é o próprio backend rodando localmente
    if pgrep -f "node.*backend" >/dev/null || pgrep -f "npm.*start" >/dev/null; then
        echo "❌ Backend Node.js rodando localmente:"
        pgrep -f "node.*backend\|npm.*start" | xargs ps -p 2>/dev/null || true
        port_in_use=1
    fi
    
    if [[ $port_in_use -eq 0 ]]; then
        echo "✅ Porta 3001 está livre"
    fi
    
    return $port_in_use
}

# Verificar porta 3001
if check_port_3001; then
    echo ""
    echo "🎯 Soluções disponíveis:"
    echo "1. Parar processo Node.js na porta 3001"
    echo "2. Alterar porta do Docker para 3002"
    echo "3. Forçar kill de todos os processos na porta 3001"
    echo "4. Cancelar"
    echo ""
    
    read -p "Escolha uma opção (1-4): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            echo "🛑 Parando processos Node.js..."
            
            # Parar processos Node.js relacionados ao backend
            if pgrep -f "node.*backend" >/dev/null; then
                echo "Parando backend Node.js..."
                pkill -f "node.*backend" || sudo pkill -f "node.*backend"
            fi
            
            if pgrep -f "npm.*start" >/dev/null; then
                echo "Parando npm start..."
                pkill -f "npm.*start" || sudo pkill -f "npm.*start"
            fi
            
            # Verificar processos na porta 3001
            local pids=$(sudo lsof -t -i :3001 2>/dev/null || true)
            if [[ -n "$pids" ]]; then
                echo "Parando processos na porta 3001: $pids"
                sudo kill -9 $pids
            fi
            ;;
            
        2)
            echo "🔄 Alterando porta do Docker para 3002..."
            
            cd docker
            
            # Fazer backup
            cp docker-compose.yml "docker-compose.yml.backup.$(date +%Y%m%d-%H%M%S)"
            
            # Alterar porta do backend
            sed -i 's/"3001:3001"/"3002:3001"/g' docker-compose.yml
            sed -i "s/'3001:3001'/'3002:3001'/g" docker-compose.yml
            sed -i 's/- 3001:3001/- 3002:3001/g' docker-compose.yml
            
            # Alterar variável de ambiente do frontend
            sed -i 's/localhost:3001/localhost:3002/g' docker-compose.yml
            
            echo "✅ Porta alterada para 3002"
            echo "⚠️  Backend agora estará em http://localhost:3002"
            
            cd ..
            ;;
            
        3)
            echo "💀 Forçando kill de processos na porta 3001..."
            
            # Encontrar PIDs usando a porta
            local pids=$(sudo lsof -t -i :3001 2>/dev/null || true)
            
            if [[ -n "$pids" ]]; then
                echo "Processos encontrados: $pids"
                sudo kill -9 $pids
                echo "✅ Processos finalizados"
            else
                echo "⚠️  Nenhum processo encontrado"
            fi
            ;;
            
        4)
            echo "❌ Operação cancelada"
            exit 0
            ;;
            
        *)
            echo "❌ Opção inválida"
            exit 1
            ;;
    esac
    
    echo ""
    echo "🔄 Verificando novamente..."
    sleep 2
    
    if check_port_3001; then
        echo "❌ Porta 3001 ainda está em uso. Tente uma solução diferente."
        exit 1
    else
        echo "✅ Porta 3001 agora está livre!"
    fi
fi

echo ""
echo "🚀 Tentando iniciar containers..."

cd docker

# Limpar containers anteriores
echo "🧹 Limpando containers anteriores..."
docker-compose down 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Tentar iniciar
echo "▶️  Iniciando containers..."
if docker-compose up -d; then
    echo ""
    echo "✅ Containers iniciados com sucesso!"
    echo ""
    echo "📊 Status dos containers:"
    docker-compose ps
    echo ""
    echo "🌐 Serviços disponíveis:"
    echo "   Database: localhost:5432"
    
    if grep -q "3002:3001" docker-compose.yml; then
        echo "   Backend:  http://localhost:3002"
    else
        echo "   Backend:  http://localhost:3001"
    fi
    echo "   Frontend: http://localhost:5173"
    echo ""
    echo "🎉 Projeto iniciado com sucesso!"
    
else
    echo ""
    echo "❌ Falha ao iniciar containers"
    echo ""
    echo "📋 Diagnóstico:"
    echo "Logs dos containers:"
    docker-compose logs
    echo ""
    echo "Status das portas:"
    if command -v ss >/dev/null 2>&1; then
        ss -tlnp | grep -E ':(5432|3001|3002|5173) ' || echo "Nenhuma porta em uso"
    else
        sudo lsof -i :5432 -i :3001 -i :3002 -i :5173 || echo "Nenhuma porta em uso"
    fi
fi