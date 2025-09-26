// backend/src/scripts/updateClientPasswords.js
import prisma from '../config/prisma.js';
import cryptoService from '../services/cryptoService.js';

async function updateClientPasswords() {
  console.log('🔐 Atualizando senhas dos clientes para "Senha@123"...');

  try {
    // Hash da nova senha
    const newPasswordHash = await cryptoService.hashPassword('Senha@123');

    // Atualizar todos os clientes
    const result = await prisma.cliente.updateMany({
      data: {
        SenhaHash: newPasswordHash
      }
    });

    console.log(`✅ ${result.count} clientes tiveram suas senhas atualizadas.`);

    // Mostrar lista dos clientes atualizados
    const clients = await prisma.cliente.findMany({
      select: {
        ClienteID: true,
        NomeCompleto: true,
        Email: true,
        TipoPessoa: true,
        role: true
      },
      orderBy: { ClienteID: 'asc' }
    });

    console.log('\n📋 Clientes com senha atualizada:');
    clients.forEach(client => {
      console.log(`${client.ClienteID}: ${client.NomeCompleto} (${client.TipoPessoa}) - ${client.Email} - Role: ${client.role}`);
    });

    console.log('\n🔑 Nova senha para todos: Senha@123');

  } catch (error) {
    console.error('❌ Erro ao atualizar senhas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateClientPasswords();
}

export default updateClientPasswords;