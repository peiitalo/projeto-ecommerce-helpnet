// backend/src/scripts/fixProductEmpresaId.js
import prisma from '../config/prisma.js';

async function fixProductEmpresaId() {
  console.log('🔧 Iniciando correção de EmpresaID nos produtos...');

  try {
    // Find all products that have VendedorID but no EmpresaID
    const produtosParaCorrigir = await prisma.produto.findMany({
      where: {
        VendedorID: { not: null },
        EmpresaID: null
      },
      select: {
        ProdutoID: true,
        Nome: true,
        SKU: true,
        VendedorID: true,
        vendedor: {
          select: {
            EmpresaID: true,
            Nome: true
          }
        }
      }
    });

    console.log(`📦 Encontrados ${produtosParaCorrigir.length} produtos para corrigir`);

    let corrigidos = 0;
    let erros = 0;

    for (const produto of produtosParaCorrigir) {
      try {
        if (!produto.vendedor?.EmpresaID) {
          console.log(`⚠️  Vendedor do produto ${produto.SKU} não tem EmpresaID, pulando...`);
          erros++;
          continue;
        }

        await prisma.produto.update({
          where: { ProdutoID: produto.ProdutoID },
          data: { EmpresaID: produto.vendedor.EmpresaID }
        });

        console.log(`✅ Produto ${produto.SKU} corrigido com EmpresaID: ${produto.vendedor.EmpresaID}`);
        corrigidos++;
      } catch (error) {
        console.error(`❌ Erro ao corrigir produto ${produto.SKU}:`, error.message);
        erros++;
      }
    }

    console.log(`\n🎉 Correção concluída!`);
    console.log(`✅ Produtos corrigidos: ${corrigidos}`);
    console.log(`❌ Erros: ${erros}`);

  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductEmpresaId();