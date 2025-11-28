import 'dotenv/config';
import prisma from './src/config/prisma.js';

async function checkProductsWithoutImages() {
  try {
    // First, get all products
    const allProducts = await prisma.produto.findMany({
      select: {
        ProdutoID: true,
        Nome: true,
        Imagens: true,
        Ativo: true
      }
    });

    console.log(`Total de produtos: ${allProducts.length}`);

    const productsWithoutImages = allProducts.filter(p => p.Imagens.length === 0);

    console.log(`Encontrados ${productsWithoutImages.length} produtos sem imagens (incluindo inativos):`);
    productsWithoutImages.forEach(product => {
      console.log(`ID: ${product.ProdutoID}, Nome: ${product.Nome}, Ativo: ${product.Ativo}, Imagens: ${JSON.stringify(product.Imagens)}`);
    });

    const activeWithoutImages = productsWithoutImages.filter(p => p.Ativo);
    console.log(`\nProdutos ativos sem imagens: ${activeWithoutImages.length}`);

    // Also show products with images
    const productsWithImages = allProducts.filter(p => p.Imagens.length > 0);
    console.log(`\nProdutos com imagens: ${productsWithImages.length}`);
    productsWithImages.forEach(product => {
      console.log(`ID: ${product.ProdutoID}, Nome: ${product.Nome}, Num imagens: ${product.Imagens.length}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductsWithoutImages();