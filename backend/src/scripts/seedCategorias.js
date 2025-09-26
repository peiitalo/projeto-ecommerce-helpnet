import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedCategorias() {
  try {
    console.log('Iniciando seed das categorias...');

    const categorias = [
      { Nome: 'Eletrônicos' },
      { Nome: 'Casa e Decoração' },
      { Nome: 'Beleza e Saúde' },
      { Nome: 'Moda e Acessórios' },
      { Nome: 'Esportes e Lazer' },
      { Nome: 'Livros e Entretenimento' },
      { Nome: 'Outras' }
    ];

    console.log('Tentando conectar ao banco de dados...');

    for (const categoria of categorias) {
      console.log(`Processando categoria: ${categoria.Nome}`);

      // Verificar se categoria já existe
      const existente = await prisma.categoria.findFirst({
        where: {
          Nome: {
            equals: categoria.Nome,
            mode: 'insensitive'
          }
        }
      });

      console.log(`Categoria existente? ${existente ? 'Sim' : 'Não'}`);

      if (!existente) {
        const novaCategoria = await prisma.categoria.create({
          data: categoria
        });
        console.log(`Categoria '${categoria.Nome}' criada com sucesso (ID: ${novaCategoria.CategoriaID})`);
      } else {
        console.log(`Categoria '${categoria.Nome}' já existe (ID: ${existente.CategoriaID})`);
      }
    }

    console.log('Seed das categorias concluído!');
  } catch (error) {
    console.error('Erro no seed das categorias:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCategorias();
}

export default seedCategorias;