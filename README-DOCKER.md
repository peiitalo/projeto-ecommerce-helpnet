# 🐳 Projeto E-commerce - Configuração Docker

Este projeto está configurado para rodar completamente em containers Docker, incluindo frontend, backend e banco de dados PostgreSQL.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Portas 3001 e 5173 disponíveis

## 🚀 Como executar

### 1. Clonar e navegar para o projeto
```bash
cd /home/peiitalo/projetos/projeto-ecommerce-helpnet
```

### 2. Executar com Docker Compose
```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou executar em background
docker-compose up --build -d
```

### 3. Acessar a aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Banco PostgreSQL**: localhost:5432

## 🛠️ Comandos úteis

### Parar os serviços
```bash
docker-compose down
```

### Parar e remover volumes (limpar banco)
```bash
docker-compose down -v
```

### Ver logs dos serviços
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Executar comandos no backend
```bash
# Acessar container do backend
docker-compose exec backend sh

# Executar migrações manualmente
docker-compose exec backend npx prisma migrate deploy

# Ver status do banco
docker-compose exec backend npx prisma migrate status
```

### Executar comandos no banco
```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d projeto_ecommerce

# Backup do banco
docker-compose exec postgres pg_dump -U postgres projeto_ecommerce > backup.sql
```

## 📁 Estrutura dos Containers

### 🗄️ PostgreSQL (postgres)
- **Imagem**: postgres:15-alpine
- **Porta**: 5432
- **Banco**: projeto_ecommerce
- **Usuário**: postgres
- **Senha**: postgres123
- **Volume**: Dados persistidos em `postgres_data`

### 🔧 Backend (backend)
- **Base**: node:18-alpine
- **Porta**: 3001
- **Funcionalidades**:
  - API REST com Express
  - Prisma ORM
  - Migrações automáticas
  - Hot reload em desenvolvimento

### ⚛️ Frontend (frontend)
- **Base**: node:18-alpine
- **Porta**: 5173
- **Funcionalidades**:
  - React + Vite
  - Hot reload
  - TailwindCSS
  - Conecta automaticamente com backend

## 🔧 Configurações

### Variáveis de Ambiente

#### Backend (.env.docker)
```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/projeto_ecommerce
NODE_ENV=production
PORT=3001
```

#### Frontend (.env.docker)
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### Problema: Porta já em uso
```bash
# Verificar processos usando as portas
sudo lsof -i :3001
sudo lsof -i :5173
sudo lsof -i :5432

# Parar processos se necessário
sudo kill -9 <PID>
```

### Problema: Erro de conexão com banco
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Reiniciar apenas o banco
docker-compose restart postgres

# Ver logs do banco
docker-compose logs postgres
```

### Problema: Migrações não aplicadas
```bash
# Aplicar migrações manualmente
docker-compose exec backend npx prisma migrate deploy

# Reset completo do banco (CUIDADO: apaga dados)
docker-compose exec backend npx prisma migrate reset
```

### Problema: Dependências desatualizadas
```bash
# Reconstruir containers
docker-compose build --no-cache

# Limpar tudo e reconstruir
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## 📊 Monitoramento

### Status dos serviços
```bash
docker-compose ps
```

### Uso de recursos
```bash
docker stats
```

### Logs em tempo real
```bash
docker-compose logs -f --tail=100
```

## 🔒 Segurança

- Senhas padrão apenas para desenvolvimento
- Em produção, altere as credenciais do banco
- Configure variáveis de ambiente seguras
- Use secrets do Docker Swarm em produção

## 📝 Notas

- O banco de dados persiste os dados mesmo após parar os containers
- O frontend tem hot reload ativado para desenvolvimento
- As migrações do Prisma são aplicadas automaticamente
- Todos os serviços estão na mesma rede Docker para comunicação interna