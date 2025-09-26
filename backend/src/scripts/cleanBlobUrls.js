// backend/src/scripts/cleanBlobUrls.js
import prisma from "../config/prisma.js";

async function cleanBlobUrls() {
  try {
    console.log('🔍 Buscando produtos com URLs de blob...');

    // Buscar todos os produtos
    const produtos = await prisma.produto.findMany({
      select: {
        ProdutoID: true,
        Nome: true,
        Imagens: true
      }
    });

    let produtosAtualizados = 0;
    let totalImagensRemovidas = 0;

    for (const produto of produtos) {
      if (produto.Imagens && produto.Imagens.length > 0) {
        const imagensOriginais = produto.Imagens.length;

        // Filtrar URLs de blob e strings vazias
        const imagensValidas = produto.Imagens.filter(img =>
          img &&
          typeof img === 'string' &&
          !img.startsWith('blob:') &&
          img.trim() !== '' &&
          img.length > 10 // URLs muito curtas provavelmente são inválidas
        );

        // Se houve mudança, atualizar o produto
        if (imagensValidas.length !== produto.Imagens.length) {
          await prisma.produto.update({
            where: { ProdutoID: produto.ProdutoID },
            data: { Imagens: imagensValidas }
          });

          const imagensRemovidas = imagensOriginais - imagensValidas.length;
          totalImagensRemovidas += imagensRemovidas;

          console.log(`✅ Produto ${produto.ProdutoID} (${produto.Nome}): ${imagensOriginais} → ${imagensValidas.length} imagens (${imagensRemovidas} removidas)`);
          produtosAtualizados++;
        }
      }
    }

    console.log(`\n🎉 Limpeza concluída!`);
    console.log('📊 Estatísticas:');
    console.log(`   - Total de produtos verificados: ${produtos.length}`);
    console.log(`   - Produtos com imagens limpas: ${produtosAtualizados}`);
    console.log(`   - Total de imagens inválidas removidas: ${totalImagensRemovidas}`);

    if (produtosAtualizados === 0) {
      console.log('✨ Nenhum produto precisava de limpeza!');
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanBlobUrls();
}

export { cleanBlobUrls };