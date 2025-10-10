import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkImages() {
  try {
    console.log('Verificando imagens dos produtos...');

    const produtos = await prisma.produto.findMany({
      select: {
        ProdutoID: true,
        Nome: true,
        Imagens: true,
        Ativo: true
      },
      where: {
        Imagens: {
          isEmpty: false
        }
      }
    });

    console.log(`\nProdutos com imagens (${produtos.length}):`);
    produtos.forEach(prod => {
      console.log(`\nProduto ${prod.ProdutoID}: ${prod.Nome}`);
      console.log(`  Ativo: ${prod.Ativo}`);
      console.log(`  Imagens (${prod.Imagens.length}):`);
      prod.Imagens.forEach((img, idx) => {
        console.log(`    ${idx + 1}: ${img}`);
      });
    });

    // Verificar produtos sem imagens
    const produtosSemImagens = await prisma.produto.count({
      where: {
        OR: [
          { Imagens: { isEmpty: true } },
          { Imagens: null }
        ]
      }
    });

    console.log(`\nProdutos sem imagens: ${produtosSemImagens}`);

  } catch (error) {
    console.error('Erro ao verificar imagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();