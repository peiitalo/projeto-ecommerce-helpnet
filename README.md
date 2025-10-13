# HelpNet - Plataforma de E-commerce Multi-Vendedor

HelpNet é uma plataforma completa de marketplace multi-vendedor que conecta vendedores locais a clientes em busca de produtos diversos. Construída com tecnologias web modernas, oferece processamento seguro de pagamentos via Mercado Pago, gerenciamento completo de pedidos, rastreamento de entregas e ferramentas avançadas de gestão para vendedores e clientes.

## 📋 Sumário

- [Visão Geral do Projeto](#project-overview)
- [Arquitetura](#architecture)
- [Pilha Tecnológica](#technology-stack)
- [Pré-requisitos](#prerequisites)
- [Instalação e Configuração](#installation--setup)
- [Configuração do Ambiente](#environment-configuration)
- [Configuração do Banco de Dados](#database-setup)
- [Scripts Disponíveis](#available-scripts)
- [Documentação da API](#api-documentation)
- [Esquema do Banco de Dados](#database-schema)
- [Implantação](#deployment)
- [Contribuição](#contributing)
- [Licença](#license)

## 🎯 Visão Geral do Projeto

HelpNet é uma plataforma de e-commerce completa que conecta vendedores com clientes através de um marketplace online perfeito. A plataforma suporta múltiplos vendedores, cada um gerenciando seu próprio catálogo de produtos, enquanto os clientes podem navegar, comprar e rastrear pedidos em diferentes vendedores.

### Principais Recursos

- **Marketplace Multi-Vendedor**: Plataforma completa para vendedores individuais e empresas operarem lojas online
- **Processamento de Pagamentos**: Integração nativa com Mercado Pago com comissionamento automático de 10%
- **Gestão Completa de Pedidos**: Do checkout à entrega, com controle total do ciclo de vida
- **Rastreamento de Entregas**: Sistema integrado de logística com códigos de rastreamento e status em tempo real
- **CRM para Vendedores**: Gestão de relacionamento com clientes, histórico de compras e comunicação direta
- **Analytics e Relatórios**: Dashboards avançados com métricas de vendas, produtos mais vendidos e análise financeira
- **Sistema de Notificações**: Alertas em tempo real para vendedores e clientes sobre pedidos e entregas
- **Carrinho e Favoritos**: Experiência completa de e-commerce com persistência de carrinho e lista de desejos
- **Avaliações e Reviews**: Sistema de classificação de produtos para construir confiança
- **Gestão de Inventário**: Controle de estoque, categorias organizadas e upload de imagens de produtos
- **Interface Responsiva**: Design mobile-first otimizado para desktop e dispositivos móveis
- **Autenticação Segura**: Sistema JWT com roles específicos (Cliente, Vendedor, Admin)

## 🏗️ Arquitetura

A aplicação segue uma arquitetura inspirada em microsserviços com aplicações frontend e backend separadas:

### Arquitetura Backend
- **Framework**: Node.js com Express.js
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: Tokens JWT com mecanismo de token de atualização
- **Upload de Arquivos**: Multer para manipulação de imagens de produtos
- **Serviço de Email**: Integração SendGrid para notificações
- **Processamento de Pagamentos**: Integração com API do Mercado Pago
- **Cache**: Cache em memória com TTL configurável
- **Limitação de Taxa**: Express rate limiter para proteção da API

### Arquitetura Frontend
- **Framework**: React 19 com ferramenta de build Vite
- **Roteamento**: React Router para navegação SPA
- **Gerenciamento de Estado**: API de Contexto do React
- **Estilização**: Tailwind CSS para design responsivo
- **Gráficos**: Chart.js para visualização de análises
- **Formulários**: React Input Mask para entradas formatadas
- **Notificações**: React Toastify para feedback do usuário

## 🛠️ Pilha Tecnológica

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma 6.15.0
- **Autenticação**: JSON Web Tokens (jsonwebtoken 9.0.2)
- **Validação**: Validator.js 13.15.15, validação CPF/CNPJ
- **Segurança**: Helmet 8.1.0, CORS 2.8.5, bcrypt 6.0.0
- **Email**: SendGrid Mail API 8.1.6
- **Upload de Arquivos**: Multer 2.0.2
- **Limitação de Taxa**: express-rate-limit 8.1.0
- **Compressão**: compression 1.8.1
- **Logging**: Winston logger (custom implementation)
- **Pagamentos**: Mercado Pago (integração direta)
- **Templates**: Handlebars 4.7.8 para emails

### Frontend
- **Framework**: React 19.1.1
- **Ferramenta de Build**: Vite 7.1.2
- **Roteamento**: React Router DOM 7.8.2
- **Estilização**: Tailwind CSS 3.4.17
- **Gráficos**: Chart.js 4.5.0 com react-chartjs-2 5.3.0
- **Formulários**: React Input Mask 2.0.4
- **Notificações**: React Toastify 11.0.5
- **Ícones**: React Icons 5.5.0
- **Cliente HTTP**: Axios (serviço de API personalizado)
- **Máscaras**: cpf-cnpj-validator 1.0.3
- **Fonte**: @fontsource/poppins 5.2.6

### DevOps e Ferramentas
- **Containerização**: Docker e Docker Compose
- **Banco de Dados**: Supabase PostgreSQL (produção)
- **Controle de Versão**: Git com commits convencionais
- **Qualidade de Código**: ESLint, Prettier
- **Gerenciamento de Commits**: Commitizen com cz-customizable

## 📋 Pré-requisitos

Antes de executar a aplicação, certifique-se de ter o seguinte instalado:

- **Node.js** 18.0 ou superior
- **npm** ou **yarn** gerenciador de pacotes
- **PostgreSQL** banco de dados (ou Docker para configuração containerizada)
- **Git** para controle de versão
- **Docker** (opcional, para implantação containerizada)

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/peiitalo/projeto-ecommerce-helpnet.git
cd projeto-ecommerce-helpnet
```

### 2. Instalar Dependências

```bash
# Instalar dependências raiz (commitizen)
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configuração do Ambiente

Copie o template de ambiente e configure suas definições:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` com sua configuração (veja a seção [Configuração do Ambiente](#environment-configuration)).

### 4. Configuração do Banco de Dados

```bash
# Executar migrações do banco de dados
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# (Opcional) Alimentar o banco de dados com dados de exemplo
npx prisma db seed
```

### 5. Iniciar Servidores de Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:3001

## ⚙️ Configuração do Ambiente

### Backend (.env)

```env
# Banco de Dados
DATABASE_URL="postgresql://username:password@localhost:5432/helpnet_db"

# Configuração JWT
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-token-secret-here"

# Integração Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="your-mercado-pago-access-token"

# Serviço de Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@helpnet.com"

# URLs da Aplicação
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3001"

# Configuração do Servidor
NODE_ENV="development"
PORT=3001

# Upload de Arquivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"
```

### Frontend (.env)

```env
VITE_API_BASE_URL="http://localhost:3001"
VITE_APP_NAME="HelpNet E-commerce"
```

## 🗄️ Configuração do Banco de Dados

A aplicação usa PostgreSQL com Prisma ORM para gerenciamento do banco de dados.

### Modelos do Banco de Dados

- **Administrador**: Administradores do sistema com níveis de acesso
- **Cliente**: Perfis completos de clientes (PF/PJ) com dados bancários e endereços
- **Vendedor**: Contas de vendedores vinculadas a empresas
- **Empresa**: Entidades empresariais para organização de vendedores
- **Endereco**: Sistema de endereços para clientes e vendedores
- **EnderecoVendedor**: Endereços específicos de vendedores
- **Produto**: Catálogo completo com SKU, códigos de barras, dimensões, frete grátis
- **Categoria**: Categorias hierárquicas de produtos
- **Pedido**: Pedidos com status, frete calculado e controle de pagamentos
- **ItensPedido**: Itens detalhados do pedido com preços na época da compra
- **MetodoPagamento**: Métodos de pagamento disponíveis
- **PagamentosPedido**: Transações de pagamento por pedido
- **DistribuicaoPagamentoPedido**: Lógica de distribuição de pagamentos entre métodos
- **Entrega**: Sistema de entregas com códigos de rastreamento
- **Rastreamento**: Eventos detalhados de rastreamento de remessa
- **Favorito**: Sistema de lista de desejos do cliente
- **CarrinhoItem**: Persistência do carrinho de compras
- **Avaliacao**: Sistema de avaliações e comentários de produtos
- **Notificacao**: Notificações push para clientes e vendedores
- **ClienteVendedor**: Relacionamentos e histórico entre clientes e vendedores
- **PasswordResetToken**: Sistema de recuperação de senha

### Comandos do Banco de Dados

```bash
# Visualizar esquema do banco de dados
npx prisma studio

# Resetar banco de dados (AVISO: exclui todos os dados)
npx prisma migrate reset

# Criar nova migração
npx prisma migrate dev --name your-migration-name

# Atualizar esquema do banco de dados
npx prisma db push
```

## 📜 Scripts Disponíveis

### Diretório Raiz
```bash
npm run commit  # Commit interativo com formato convencional
```

### Scripts do Backend
```bash
npm run dev         # Iniciar servidor de desenvolvimento com nodemon
npm run start       # Iniciar servidor de produção
npm run lint        # Executar ESLint
npm run format      # Formatar código com Prettier
```

### Scripts do Frontend
```bash
npm run dev         # Iniciar servidor de desenvolvimento Vite
npm run build       # Construir para produção
npm run lint        # Executar ESLint
npm run preview     # Visualizar build de produção
```

### Scripts do Banco de Dados
```bash
npx prisma studio           # Abrir Prisma Studio
npx prisma migrate dev      # Executar migrações em desenvolvimento
npx prisma migrate deploy   # Executar migrações em produção
npx prisma generate         # Gerar cliente Prisma
npx prisma db seed          # Alimentar banco de dados com dados de exemplo
```

## 📚 Documentação da API

O backend fornece uma API RESTful com os seguintes endpoints principais:

### Autenticação
- `POST /api/clientes/login` - Login do cliente
- `POST /api/clientes/cadastro` - Registro do cliente
- `POST /api/clientes/refresh` - Refresh token
- `POST /api/clientes/logout` - Logout do cliente
- `GET /api/clientes/auto-login` - Auto-login com token
- `POST /api/clientes/solicitar-reset-senha` - Solicitar reset de senha
- `POST /api/clientes/resetar-senha` - Resetar senha

### Produtos
- `GET /api/produtos` - Listar produtos com filtragem e paginação
- `GET /api/produtos/:id` - Obter detalhes do produto
- `POST /api/produtos` - Criar produto (Admin/Vendedor)
- `PUT /api/produtos/:id` - Atualizar produto (Admin/Vendedor)
- `DELETE /api/produtos/:id` - Excluir produto (Admin/Vendedor)
- `POST /api/vendedor/produtos` - Criar produto (Vendedor)
- `PUT /api/vendedor/produtos/:id` - Atualizar produto (Vendedor)
- `DELETE /api/vendedor/produtos/:id` - Excluir produto (Vendedor)

### Pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos/cliente` - Obter pedidos do cliente
- `GET /api/vendedor/pedidos` - Obter pedidos do vendedor (Vendedor)
- `PUT /api/pedidos/:id/status` - Atualizar status do pedido

### Pagamentos
- `POST /api/pagamentos/webhook` - Webhook do Mercado Pago
- `GET /api/pagamentos/status/:pedidoId` - Status do pagamento
- `POST /api/pagamentos/processar` - Processar pagamento

### Entrega
- `POST /api/entregas` - Criar entrega (Vendedor)
- `PUT /api/entregas/:id/status` - Atualizar status da entrega
- `GET /api/entregas/rastreamento/:codigo` - Rastrear remessa

### Categorias e Carrinho
- `GET /api/categorias` - Listar categorias
- `GET /api/carrinho` - Obter itens do carrinho
- `POST /api/carrinho` - Adicionar ao carrinho
- `DELETE /api/carrinho/:id` - Remover do carrinho

### Gerenciamento de Vendedor
- `GET /api/vendedor/dashboard` - Dados do dashboard do vendedor
- `GET /api/vendedor/perfil` - Perfil do vendedor
- `PUT /api/vendedor/perfil` - Atualizar perfil do vendedor
- `GET /api/vendedor/enderecos` - Endereços do vendedor
- `POST /api/vendedor/enderecos` - Criar endereço do vendedor
- `PUT /api/vendedor/enderecos/:enderecoId` - Atualizar endereço
- `DELETE /api/vendedor/enderecos/:enderecoId` - Excluir endereço
- `GET /api/vendedor/financeiro` - Dados financeiros do vendedor
- `GET /api/vendedor/clientes` - Clientes do vendedor
- `GET /api/vendedor/relatorios` - Relatórios de vendas
- `GET /api/vendedor/relatorios/estatisticas` - Estatísticas gerais
- `GET /api/vendedor/relatorios/vendas` - Dados de vendas
- `GET /api/vendedor/relatorios/exportar` - Exportar relatório CSV

### Admin (Futuro)
- `GET /api/admin/vendedores` - Listar todos os vendedores
- `GET /api/admin/pedidos` - Listar todos os pedidos

## 🗃️ Esquema do Banco de Dados

### Entidades Principais

#### Gerenciamento de Usuários
- **Cliente**: Perfis de clientes com detalhes bancários
- **Vendedor**: Contas de vendedores vinculadas a empresas
- **Empresa**: Entidades empresariais para suporte multi-vendedor
- **Administrador**: Administradores do sistema

#### Gerenciamento de Produtos
- **Produto**: Catálogo de produtos com associação de vendedor
- **Categoria**: Categorias hierárquicas de produtos
- **Avaliacao**: Avaliações e classificações de clientes

#### Processamento de Pedidos
- **Pedido**: Cabeçalhos de pedidos com rastreamento de pagamentos
- **ItensPedido**: Itens de linha do pedido
- **MetodoPagamento**: Métodos de pagamento
- **PagamentosPedido**: Transações de pagamento
- **DistribuicaoPagamentoPedido**: Lógica de distribuição de pagamentos

#### Logística
- **Endereco**: Gerenciamento de endereços para clientes e vendedores
- **Entrega**: Rastreamento de entrega
- **Rastreamento**: Atualizações de status de remessa

#### Recursos
- **Favorito**: Listas de desejos do cliente
- **CarrinhoItem**: Persistência do carrinho de compras
- **Notificacao**: Notificações do sistema
- **ClienteVendedor**: Relacionamentos vendedor-cliente

### Relacionamentos
- Clientes podem ter múltiplos endereços e pedidos
- Vendedores pertencem a empresas e gerenciam produtos
- Pedidos contêm múltiplos itens e têm registros de pagamento/distribuição
- Produtos pertencem a categorias e vendedores
- Entregas são vinculadas a pedidos com eventos de rastreamento

## 🚀 Implantação

### Implantação Docker

A aplicação inclui configurações Docker para implantação containerizada:

```bash
# Construir e iniciar todos os serviços
docker-compose -f docker/docker-compose.yml up --build

# Ou para produção
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

### Considerações de Produção

1. **Variáveis de Ambiente**: Use gerenciamento seguro de segredos
2. **Banco de Dados**: Configure instância PostgreSQL de produção
3. **SSL/TLS**: Habilite HTTPS com certificados adequados
4. **Monitoramento**: Implemente soluções de logging e monitoramento
5. **Backup**: Configure backups automatizados do banco de dados
6. **Escalabilidade**: Configure balanceamento de carga para alto tráfego

### Implantação Manual

1. Construa o frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Configure servidor de produção (nginx, Apache, etc.)

3. Implante backend no servidor com PM2 ou gerenciador de processos similar

4. Configure proxy reverso e certificados SSL

## 🤝 Contribuição

Nós acolhemos contribuições para a plataforma HelpNet! Por favor, siga estas diretrizes:

### Fluxo de Desenvolvimento

1. **Fork** o repositório
2. **Crie** uma branch de recurso: `git checkout -b feature/your-feature-name`
3. **Commit** mudanças usando commits convencionais: `npm run commit`
4. **Push** para seu fork: `git push origin feature/your-feature-name`
5. **Crie** um Pull Request

### Padrões de Código

- Use ESLint e Prettier para formatação de código
- Siga mensagens de commit convencionais
- Escreva mensagens de commit e descrições de PR descritivas
- Teste suas mudanças completamente
- Atualize a documentação conforme necessário

### Convenção de Commit

Nós usamos [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📄 Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Construído com ❤️ para a comunidade de e-commerce**

Para dúvidas ou suporte, por favor abra uma issue no GitHub.
