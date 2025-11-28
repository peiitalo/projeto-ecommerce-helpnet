// backend/src/scripts/createAdminUser.js
import 'dotenv/config';
import prisma from '../config/prisma.js';
import cryptoService from '../services/cryptoService.js';

const adminData = {
  Nome: 'Administrador',
  Email: 'admin@gmail.com',
  Senha: 'Senha@123',
  Cargo: 'Administrador do Sistema',
  NivelAcesso: 1,
  Ativo: true
};

async function createAdminUser() {
  console.log('🚀 Iniciando criação do usuário administrador padrão...');

  try {
    // Verificar se o administrador já existe
    const adminExistente = await prisma.administrador.findUnique({
      where: { Email: adminData.Email }
    });

    if (adminExistente) {
      console.log(`⚠️  Administrador ${adminData.Email} já existe, pulando criação...`);
      return;
    }

    // Hash da senha usando cryptoService
    const SenhaHash = await cryptoService.hashPassword(adminData.Senha);

    // Criar administrador
    const novoAdmin = await prisma.administrador.create({
      data: {
        Nome: adminData.Nome,
        Email: adminData.Email.toLowerCase(),
        SenhaHash,
        Cargo: adminData.Cargo,
        NivelAcesso: adminData.NivelAcesso,
        Ativo: adminData.Ativo
      }
    });

    console.log(`✅ Administrador criado com sucesso: ${adminData.Email} (ID: ${novoAdmin.AdminID})`);

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export default createAdminUser;