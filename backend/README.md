# Backend - Organização de Pastas

Este backend segue uma arquitetura organizada por responsabilidade e por recurso, facilitando manutenção e escalabilidade.

Estrutura principal
- src/
  - config/: configurações e integrações (ex.: prisma.js)
  - controllers/: lógica de cada recurso (clientes, produtos, categorias, pedidos, etc.)
  - routes/: definição de rotas separadas por recurso (clientes, produtos, categorias, carrinho, etc.)
  - middleware/: middlewares (autenticação, validação, escopo de vendedor, erros)
  - services/: serviços e regras de negócio reutilizáveis (e-mail, pagamento, crypto, etc.)
  - utils/: utilitários (logger, validações)
  - index.js: inicialização do servidor e registro das rotas
- prisma/: schema e migrations
- Dockerfile, package.json, .env.example

Padrões adotados
- Rotas por recurso (ex.: clienteRoutes, produtoRoutes, categoriaRoutes, etc.)
- Um controller por recurso, exportando as funções usadas nas rotas
- Middlewares genéricos em src/middleware (ex.: authMiddleware, errorHandler, vendorScope)
- Services encapsulam integrações de terceiros e regras reutilizáveis (pagamentos, e-mails)
- Utils para logging centralizado e validators

Observações de naming
Há coexistência de arquivos com prefixos "vendor" e "vendedor" por compatibilidade (ex.: vendorProdutoRoutes.js, vendorPedidoRoutes.js e vendedorRoutes.js). Em produção, recomenda-se padronizar para um único idioma, porém manteremos a coexistência enquanto houver consumidores da API usando esses caminhos.

Boas práticas
- Validar entrada no controller ou via middleware de validação
- Centralizar respostas de erro via errorHandler e logging via utils/logger
- Não acessar prisma ou integrações diretamente nas rotas; usar controllers e services

Start
- Dev: npm run dev
- Prod: npm start
- Healthcheck: GET /api/health
