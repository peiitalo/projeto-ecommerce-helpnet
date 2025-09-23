import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database content...');

    const categorias = await prisma.categoria.findMany();
    console.log(`\nCategories (${categorias.length}):`);
    categorias.forEach(cat => console.log(`  - ${cat.CategoriaID}: ${cat.Nome}`));

    const produtos = await prisma.produto.findMany();
    console.log(`\nProducts (${produtos.length}):`);
    produtos.forEach(prod => console.log(`  - ${prod.ProdutoID}: ${prod.Nome} (${prod.Ativo ? 'Active' : 'Inactive'})`));

    const clientes = await prisma.cliente.findMany();
    console.log(`\nClients (${clientes.length}):`);
    clientes.forEach(cliente => console.log(`  - ${cliente.ClienteID}: ${cliente.Nome} (${cliente.Role})`));

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();