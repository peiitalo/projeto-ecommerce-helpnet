import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCategories() {
  try {
    console.log('Creating categories...');

    const categories = [
      { Nome: 'Eletrônicos' },
      { Nome: 'Casa e Decoração' },
      { Nome: 'Beleza e Saúde' },
      { Nome: 'Moda e Acessórios' },
      { Nome: 'Esportes e Lazer' },
      { Nome: 'Livros e Entretenimento' },
      { Nome: 'Outras' }
    ];

    for (const categoria of categories) {
      try {
        const result = await prisma.categoria.create({
          data: categoria
        });
        console.log(`✅ Created category: ${categoria.Nome} (ID: ${result.CategoriaID})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Category '${categoria.Nome}' already exists`);
        } else {
          console.error(`❌ Error creating category '${categoria.Nome}':`, error.message);
        }
      }
    }

    console.log('Categories creation completed!');
  } catch (error) {
    console.error('Error in createCategories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCategories();