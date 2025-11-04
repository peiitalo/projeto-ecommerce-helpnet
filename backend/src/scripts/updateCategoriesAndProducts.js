// backend/src/scripts/updateCategoriesAndProducts.js
import prisma from '../config/prisma.js';

const newCategories = [
  { Nome: 'Casa e Decoração' },
  { Nome: 'Moda e Acessórios' },
  { Nome: 'Beleza e Saúde' },
  { Nome: 'Livros e Entretenimento' },
  { Nome: 'Eletrônicos' },
  { Nome: 'Outros' }
];

const categoryMapping = {
  'Eletrônicos': 'Eletrônicos',
  'Roupas': 'Moda e Acessórios',
  'Livros': 'Livros e Entretenimento',
  'Casa e Jardim': 'Casa e Decoração',
  'Esportes': 'Outros',
  'Beleza': 'Beleza e Saúde',
  'Automotivo': 'Outros',
  'Brinquedos': 'Livros e Entretenimento',
  'Alimentos': 'Outros',
  'Saúde': 'Beleza e Saúde'
};

const productImages = {
  // Casa e Decoração
  'CASA-ABC-001': ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'],
  'CASA-TECH-001': ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'],
  'CASA-GERAL-001': ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
  'CASA-XYZ-001': ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
  'CASA-DIG-001': ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'],

  // Moda e Acessórios
  'MODA-ABC-001': ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
  'MODA-TECH-001': ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
  'MODA-GERAL-001': ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'],
  'MODA-XYZ-001': ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'],
  'MODA-DIG-001': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],

  // Beleza e Saúde
  'BEA-ABC-001': ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'],
  'BEA-TECH-001': ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
  'BEA-GERAL-001': ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'],
  'BEA-XYZ-001': ['https://images.unsplash.com/photo-1585435557343-3b092031e2bb?w=400'],
  'BEA-DIG-001': ['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400'],

  // Livros e Entretenimento
  'LIV-ABC-001': ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
  'LIV-TECH-001': ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
  'LIV-GERAL-001': ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
  'LIV-XYZ-001': ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
  'LIV-DIG-001': ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400'],

  // Eletrônicos
  'ELE-ABC-001': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
  'ELE-TECH-001': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
  'ELE-GERAL-001': ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
  'ELE-XYZ-001': ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'],
  'ELE-DIG-001': ['https://images.unsplash.com/photo-1609594040184-41ac6e0351a0?w=400']
};

async function updateCategoriesAndProducts() {
  console.log('🚀 Iniciando atualização de categorias e produtos...');

  try {
    // Create new categories first
    for (const cat of newCategories) {
      const existing = await prisma.categoria.findFirst({ where: { Nome: cat.Nome } });
      if (!existing) {
        await prisma.categoria.create({ data: cat });
        console.log(`✅ Categoria criada: ${cat.Nome}`);
      } else {
        console.log(`⚠️  Categoria ${cat.Nome} já existe`);
      }
    }

    // Update product categories and add images
    const products = await prisma.produto.findMany({
      include: { categoria: true }
    });

    for (const product of products) {
      let newCategoryName = categoryMapping[product.categoria?.Nome];
      if (!newCategoryName) {
        newCategoryName = 'Outros'; // Default fallback
      }

      const newCategory = await prisma.categoria.findFirst({
        where: { Nome: newCategoryName }
      });

      if (newCategory && newCategory.CategoriaID !== product.CategoriaID) {
        await prisma.produto.update({
          where: { ProdutoID: product.ProdutoID },
          data: {
            CategoriaID: newCategory.CategoriaID,
            Imagens: productImages[product.SKU] || []
          }
        });
        console.log(`🔄 Produto ${product.Nome} movido para categoria ${newCategoryName}`);
      } else {
        // Just update images
        await prisma.produto.update({
          where: { ProdutoID: product.ProdutoID },
          data: {
            Imagens: productImages[product.SKU] || []
          }
        });
        console.log(`🖼️  Imagens atualizadas para produto ${product.Nome}`);
      }
    }

    // Now delete old categories that are not in the new list and have no products
    const oldCategories = await prisma.categoria.findMany({
      include: { produtos: true }
    });

    for (const cat of oldCategories) {
      const existsInNew = newCategories.some(nc => nc.Nome === cat.Nome);
      if (!existsInNew && cat.produtos.length === 0) {
        console.log(`🗑️  Removendo categoria antiga vazia: ${cat.Nome}`);
        await prisma.categoria.delete({ where: { CategoriaID: cat.CategoriaID } });
      } else if (!existsInNew && cat.produtos.length > 0) {
        console.log(`⚠️  Mantendo categoria ${cat.Nome} pois tem ${cat.produtos.length} produtos`);
      }
    }

    console.log('\n🎉 Atualização de categorias e produtos concluída!');

    // Summary
    const totalCategorias = await prisma.categoria.count();
    const totalProdutos = await prisma.produto.count();

    console.log(`\n📊 Resumo:`);
    console.log(`Total de categorias: ${totalCategorias}`);
    console.log(`Total de produtos: ${totalProdutos}`);

    // List categories
    const categorias = await prisma.categoria.findMany({
      orderBy: { Nome: 'asc' },
      include: { _count: { select: { produtos: true } } }
    });
    console.log('\n📂 Categorias:');
    categorias.forEach(cat => console.log(`  - ${cat.Nome} (${cat._count.produtos} produtos)`));

  } catch (error) {
    console.error('❌ Erro na atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCategoriesAndProducts();
}

export default updateCategoriesAndProducts;