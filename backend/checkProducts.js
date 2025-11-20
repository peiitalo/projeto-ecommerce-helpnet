import prisma from './src/config/prisma.js';

async function checkProducts() {
  try {
    const products = await prisma.produto.findMany({
      select: {
        ProdutoID: true,
        Nome: true,
        Preco: true,
        Desconto: true,
        FreteGratis: true
      },
      where: { Ativo: true }
    });

    console.log('Produtos com desconto:');
    products.forEach(product => {
      if (product.Desconto > 0) {
        const precoBase = product.Preco;
        const desconto = product.Desconto;
        const precoComDesconto = precoBase * (1 - desconto / 100);
        const precoOriginal = precoBase / (1 - desconto / 100);

        console.log(`${product.Nome}:`);
        console.log(`  Preço base: R$ ${precoBase.toFixed(2)}`);
        console.log(`  Desconto: ${desconto}%`);
        console.log(`  Preço com desconto: R$ ${precoComDesconto.toFixed(2)}`);
        console.log(`  Preço original calculado: R$ ${precoOriginal.toFixed(2)}`);
        console.log('');
      }
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();