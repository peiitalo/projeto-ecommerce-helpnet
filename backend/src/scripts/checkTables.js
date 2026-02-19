import prisma from '../config/prisma.js';

async function checkTables() {
  try {
    console.log('Checking tables...');

    // Check if favorito table exists
    try {
      const favoritos = await prisma.favorito.findMany({ take: 1 });
      console.log('Favorito table exists, count:', await prisma.favorito.count());
    } catch (e) {
      console.log('Favorito table error:', e.message);
    }

    // Check if cupom table exists
    try {
      const cupons = await prisma.cupom.findMany({ take: 1 });
      console.log('Cupom table exists, count:', await prisma.cupom.count());
    } catch (e) {
      console.log('Cupom table error:', e.message);
    }

    // Check if cupomCliente table exists
    try {
      const cupomClientes = await prisma.cupomCliente.findMany({ take: 1 });
      console.log('CupomCliente table exists, count:', await prisma.cupomCliente.count());
    } catch (e) {
      console.log('CupomCliente table error:', e.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();