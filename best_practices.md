### 📘 Project Best Practices

#### 1. Project Purpose  
Aplicação full-stack de e-commerce (domínio varejo) em desenvolvimento, com foco atual no cadastro e autenticação de clientes. O backend expõe APIs REST em Node.js/Express com Prisma ORM conectado a PostgreSQL. O frontend usa React + Vite e TailwindCSS para uma UI responsiva de cadastro multi-etapas (PF/PJ), incluindo validações, máscaras e auto-preenchimento de endereço via ViaCEP.

#### 2. Project Structure  
- Raiz
  - backend/ — API REST (Express), Prisma ORM, validações e serviços
  - frontend/ — SPA (React + Vite + Tailwind) com páginas e estilos
  - README.md — informações genéricas de template
  - best_practices.md — este guia

- Backend
  - backend/.env — configurações sensíveis (DATABASE_URL)
  - backend/package.json — dependências e scripts (dev via nodemon)
  - backend/prisma/
    - schema.prisma — modelos e relações (Cliente, Endereco, Produto, Pedido, etc.)
    - migrations/ — histórico de migrações Prisma
  - backend/src/
    - index.js — entrypoint Express; registra middlewares e rotas
    - routes/clienteRoutes.js — mapeia endpoints de cliente
    - controllers/clienteController.js — orquestra validações, hashing e persistência
    - services/cryptoService.js — hashing de senha e utilitários de máscara
    - utils/validators.js — validações (senha, CPF/CNPJ, Email, CEP)
    - middlewares/ — reservado (vazio hoje) para middlewares globais
    - generated/prisma/** — cliente Prisma gerado (recomendado não manter em VCS; preferir @prisma/client)

- Frontend
  - frontend/package.json — dependências e scripts (dev, build, preview)
  - frontend/vite.config.js — config Vite
  - frontend/tailwind.config.js — configuração de Tailwind
  - frontend/src/
    - main.jsx — bootstrap React
    - App.jsx — carrega a página Cadastro
    - pages/cadastro.jsx — fluxo completo de cadastro com etapas e máscara
    - index.css — estilos base + animações utilitárias

Observações de arquitetura
- Separação de camadas no backend: routes → controllers → services/utils → ORM (Prisma)
- Convenção de rotas: prefixo /api para recursos (ex.: /api/clientes, /api/clientes/login)
- Configuração via .env (DATABASE_URL). Port padrão 3001 no backend; frontend via Vite (5173 por padrão)

#### 3. Test Strategy  
Status atual: não há testes automatizados. Recomendação:
- Backend
  - Framework: Jest
  - Estrutura: criar pasta backend/tests com subpastas por domínio (ex.: tests/clientes/clienteController.test.js)
  - Cobrir: validações (utils/validators), controllers (happy-path e erros), serviços (cryptoService)
  - Mocking: mock de PrismaClient e de bcryptjs; testes de integração com banco em memória ou PostgreSQL de teste (usar DATABASE_URL_TEST)
  - Alvos: respostas REST (status, body shape), tratamento de erros (P2002, 400/401/500)
- Frontend
  - Framework: Vitest + @testing-library/react
  - Estrutura: frontend/src/__tests__ com espelho de pastas (ex.: pages/cadastro.test.jsx)
  - Cobrir: renderização de etapas, máscaras, validação visual, interação com fetch (mock), estados de carregamento e erros
  - Filosofia: priorizar testes de unidade de hooks/validadores e testes de integração de fluxo de cadastro
- Cobertura: meta mínima 80% linhas/branches para módulos de validação e controllers

#### 4. Code Style  
- Geral
  - JavaScript moderno com async/await para I/O
  - Manter nomes em português por consistência com domínio e schema (ex.: NomeCompleto, CPF_CNPJ)
  - Evitar logs de dados sensíveis (senhas, CPF/CNPJ)
- Backend
  - Módulos CommonJS (require/module.exports)
  - Funções assíncronas nos controllers; sempre retornar JSON com shape consistente: { success: boolean, message?: string, data?: any, errors?: string[] }
  - Status HTTP: 201 Created (criação), 400 (validação), 401 (auth), 500 (erro interno)
  - Capturar códigos Prisma (ex.: P2002 unique) e mapear para mensagens claras
  - Organização: controllers focados em orquestração; regras de negócio nos services; validações puras em utils
- Frontend
  - React 19 com componentes funcionais; PascalCase para componentes e camelCase para variáveis/funções
  - CSS utilitário via Tailwind; classes utilitárias centralizadas quando possível (evitar duplicação de strings longas)
  - Navegação: preferir react-router ao uso direto de window.location para rotas internas
  - ESM (type: module); lint via eslint.config.js existente
- Comentários/Documentação
  - Comentar regras de validação e decisões de segurança (ex.: estratégia de hash)
  - JSDoc curto em funções utilitárias e serviços

#### 5. Common Patterns  
- Validação
  - utils/validators expõe funções puras que retornam { isValid, errors, formatted? }
  - Padronizar este shape em novas validações (ex.: telefone, UF)
- Segurança
  - Hash de senha com bcrypt (SALT_ROUNDS=12)
  - Não retornar hashes em respostas; mascarar campos quando necessário
- Controllers
  - Fluxo típico: extrair payload → validar → normalizar/formatar �� chamar service/ORM → montar resposta sem dados sensíveis
- Prisma
  - Criação aninhada (enderecos: { create: [...] })
  - Campos únicos (Email, CPF_CNPJ, CodigoCliente)
- Frontend
  - Wizard multi-etapas (estado etapaAtual), máscaras controladas e auto-preenchimento de endereço via ViaCEP
  - Feedback: estados de carregamento e exibição de erros agregados

#### 6. Do's and Don'ts  
- ✅ Do's
  - Usar validações de entrada no backend (nunca confiar apenas no frontend)
  - Normalizar e formatar dados (ex.: e-mail lower-case, UF uppercase, CEP 00000-000)
  - Manter shape de resposta consistente com success/data/errors
  - Isolar regras de negócio em services e utilitários puros
  - Versionar e aplicar migrações Prisma de forma incremental
  - Configurar variáveis de ambiente (.env) e nunca comitar segredos
  - No frontend, centralizar chamadas HTTP e baseURL via variável de ambiente (VITE_API_BASE_URL)
  - Adicionar testes para validações, controllers e fluxos críticos
- ❌ Don'ts
  - Não logar dados sensíveis (senhas, CPF/CNPJ), nem retornar hashes
  - Não duplicar lógicas de máscara/validação em múltiplos componentes; extraia para utilidades
  - Não acessar diretamente window.location para navegação SPA; use roteador
  - Não misturar regras de negócio dentro de controllers; mantenha-os finos
  - Não manter cliente Prisma gerado em VCS; prefira geração em node_modules

#### 7. Tools & Dependencies  
- Backend
  - Express 5 + cors
  - Prisma ORM (@prisma/client, prisma CLI)
  - bcryptjs, validator, cpf-cnpj-validator
  - Scripts: npm run dev (nodemon)
  - Setup sugerido:
    - Criar backend/.env com DATABASE_URL=postgresql://user:pass@host:port/db
    - npx prisma migrate dev — aplica migrações e gera cliente
    - npm run dev — inicia API em :3001
- Frontend
  - React 19 + Vite, TailwindCSS, react-icons, @react-input/mask
  - Scripts: npm run dev/build/preview
  - Setup sugerido:
    - Criar frontend/.env.local com VITE_API_BASE_URL=http://localhost:3001
    - npm run dev — inicia app em :5173

#### 8. Other Notes  
- Unicidade de CPF/CNPJ e privacidade
  - Hoje o projeto armazena CPF_CNPJ com bcrypt (salt aleatório), o que impede unicidade determinística no banco (mesmo valor gera hashes diferentes). Recomendação:
    - Manter coluna pública única (ex.: DocumentoHashDeterministico) com HMAC-SHA256 (chave/pepper do .env) sobre o documento normalizado, para garantir unicidade e buscas; e/ou
    - Armazenar o documento real criptografado com chave simétrica (se houver necessidade de recuperar); senhas devem continuar com bcrypt
    - Atualizar validações e captura de P2002 para usar o campo determinístico
- Estrutura gerada de Prisma em src/generated/prisma
  - Recomenda-se remover do VCS e depender de @prisma/client gerado em node_modules. Ajustar .gitignore se necessário
- Middlewares e Config
  - Adicionar middleware global de tratamento de erros (formato de resposta padrão)
  - Adicionar middleware de validação (ex.: validar body por schema antes do controller)
  - Centralizar config/env (ex.: config/index.js lendo process.env com defaults)
- Frontend melhorias
  - Extrair máscaras para utilidades compartilhadas
  - Adicionar react-router e organizar páginas (src/pages/**)
  - Centralizar API client (fetch/axios) com interceptors para erros
- i18n/Naming
  - Manter consistência de idioma e nomes conforme schema.prisma
  - Campos do payload devem alinhar com o backend (ex.: TipoPessoa, Endereco, CEP)
- Respostas da API
  - Manter sempre success booleano; incluir message para sucesso e errors (array) para falhas
  - Em criação (201), retornar apenas dados não sensíveis (ex.: CodigoCliente)
