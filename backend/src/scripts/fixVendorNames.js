// backend/src/scripts/fixVendorNames.js
import prisma from '../config/prisma.js';

async function fixVendorNames() {
  console.log('🚀 Iniciando correção dos nomes dos vendedores...');

  try {
    // Get all vendors with their companies
    const vendors = await prisma.vendedor.findMany({
      include: {
        empresa: true
      }
    });

    console.log('\n🏪 Vendedores encontrados:');
    vendors.forEach(v => {
      console.log(`  - ${v.Nome} (Empresa: ${v.empresa.Nome})`);
    });

    // Update vendor names to match company names
    for (const vendor of vendors) {
      if (vendor.Nome !== vendor.empresa.Nome) {
        await prisma.vendedor.update({
          where: { VendedorID: vendor.VendedorID },
          data: { Nome: vendor.empresa.Nome }
        });
        console.log(`✅ Atualizado: ${vendor.Nome} → ${vendor.empresa.Nome}`);
      } else {
        console.log(`⚠️  Já está correto: ${vendor.Nome}`);
      }
    }

    console.log('\n🎉 Correção dos nomes concluída!');

    // Verify final state
    const updatedVendors = await prisma.vendedor.findMany({
      include: {
        empresa: true
      }
    });

    console.log('\n📋 Estado final dos vendedores:');
    updatedVendors.forEach(v => {
      console.log(`  - ${v.Nome} (Empresa: ${v.empresa.Nome})`);
    });

  } catch (error) {
    console.error('❌ Erro na correção dos nomes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixVendorNames();
}

export default fixVendorNames;