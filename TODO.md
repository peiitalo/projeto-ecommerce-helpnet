# Lista de Correções e Melhorias

## Backend
- [ ] Corrigir configuração CORS para restringir origens
- [ ] Adicionar middleware de tratamento de erros centralizado
- [ ] Melhorar logging (substituir console.error por winston ou similar)
- [ ] Corrigir hashing do CPF/CNPJ no clienteController
- [ ] Melhorar geração de CodigoCliente
- [ ] Adicionar sanitização de entrada mais robusta
- [ ] Remover react-icons do package.json do backend
- [ ] Adicionar testes para endpoints

## Frontend
- [ ] Corrigir erros de linting (variáveis não utilizadas)
- [ ] Corrigir 'module' não definido em tailwind.config.js
- [ ] Corrigir aviso do useMemo em home.jsx
- [ ] Adicionar error boundaries para tratamento de erros

## Geral
- [ ] Revisar segurança (exposição de dados, validações)
- [ ] Adicionar logging estruturado
- [ ] Executar testes após correções
