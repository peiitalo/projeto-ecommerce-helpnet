module.exports = {
  types: [
    { value: 'feat', name: 'feat:     Nova funcionalidade 🚀' },
    { value: 'fix', name: 'fix:      Correção de bug 🐛' },
    { value: 'docs', name: 'docs:     Documentação 📚' },
    { value: 'style', name: 'style:    Alterações de estilo (espaços, formatação) 🎨' },
    { value: 'refactor', name: 'refactor: Refatoração de código ♻️' },
    { value: 'perf', name: 'perf:     Melhoria de desempenho ⚡' },
    { value: 'test', name: 'test:     Adição ou correção de testes 🧪' },
    { value: 'build', name: 'build:    Mudanças de build ou dependências 🏗️' },
    { value: 'ci', name: 'ci:       Alterações em pipelines ou CI/CD 🤖' },
    { value: 'chore', name: 'chore:   Tarefas de manutenção 🔧' },
    { value: 'revert', name: 'revert:  Reverter commit ⏪' }
  ],

  scopes: ["frontend", "backend", "front & back"], // Você pode adicionar escopos pré-definidos aqui, ex: ["frontend", "backend"]

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],

  messages: {
    type: "Selecione o tipo de mudança que você está fazendo:",
    scope: "Informe o escopo da mudança (opcional):",
    customScope: "Informe o escopo:",
    subject: "Escreva uma descrição breve e objetiva da mudança:\n",
    body: 'Descreva detalhadamente a mudança (pressione Enter para pular):\n',
    breaking: 'Liste quaisquer mudanças que quebram compatibilidade (BREAKING CHANGES):\n',
    footer: 'Referências de issues (ex: #123):\n',
    confirmCommit: 'Você confirma esse commit?'
  },

  subjectLimit: 72
};
