# Frontend - Organização de Pastas

Estrutura geral (React + Vite)
- src/
  - layouts/: componentes de layout de alto nível (ex.: AdminLayout, VendorLayout)
    - AdminLayout/
      - index.jsx
    - VendorLayout/
      - index.jsx
  - components/: componentes reutilizáveis e pequenos (inputs, botões, ProtectedRoute, etc.)
  - pages/: páginas da aplicação, organizadas por área (admin, clients, vendor, errors)
  - services/: chamadas à API e lógica externa (api.js e serviços por domínio)
  - hooks/: hooks customizados (ex.: useDebounce, useBuscarCep)
  - context/: contextos globais (ex.: AuthContext, CartContext)
  - utils/: funções utilitárias (logger, validações, máscaras)
  - assets/: imagens/ícones/fontes (no Vite, arquivos públicos ficam em /public)
  - styles/: estilos globais (ex.: index.css)
  - App.jsx, main.jsx

Padrões e convenções
- Componentes grandes devem ser quebrados em uma pasta própria com:
  - ComponentName/index.jsx
  - ComponentName/styles.css (se aplicável)
- Evitar lógica de API dentro de componentes; centralizar em src/services
- Reutilizar serviços existentes via src/services/api.js que já encapsula autenticação/refresh, erros e cabeçalhos

Serviços de API
- Fonte única em src/services/api.js
- Removido o uso de src/config/api.js para evitar duplicidade conceitual

Rotas e layouts
- Layouts são importados de src/layouts
- ProtectedRoute permanece em components por ser um wrapper reutilizável leve

Start
- npm run dev

Build
- npm run build

Lint/format
- npm run lint
- npm run format
