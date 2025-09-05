const { PrismaClient } = require('@prisma/client');
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
      { Nome: 'Outras' }
    ];

    for (const categoria of categorias) {
      // Verificar se categoria já existe
      const existente = await prisma.categoria.findFirst({
        where: { 
          Nome: {
            equals: categoria.Nome,
            mode: 'insensitive'
          }
        }
      });

      if (!existente) {
        await prisma.categoria.create({
          data: categoria
        });
        console.log(`Categoria '${categoria.Nome}' criada com sucesso`);
      } else {
        console.log(`Categoria '${categoria.Nome}' já existe`);
      }
    }

    console.log('Seed das categorias concluído!');
  } catch (error) {
    console.error('Erro no seed das categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedCategorias();
}

module.exports = seedCategorias;