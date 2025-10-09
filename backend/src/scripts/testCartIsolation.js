// backend/src/scripts/testCartIsolation.js
import prisma from '../config/prisma.js';

async function testCartIsolation() {
  console.log('🧪 Testando isolamento de dados do carrinho...\n');

  try {
    // Buscar ou criar usuários de teste
    let user1 = await prisma.cliente.findUnique({
      where: { Email: 'test_user_1@example.com' }
    });

    if (!user1) {
      user1 = await prisma.cliente.create({
        data: {
          CodigoCliente: 99991,
          NomeCompleto: 'Test User 1',
          Email: 'test_user_1@example.com',
          SenhaHash: 'hashed_password',
          TipoPessoa: 'FISICA',
          CPF_CNPJ: '111.222.333-44',
          role: 'CLIENTE'
        }
      });
    }

    let user2 = await prisma.cliente.findUnique({
      where: { Email: 'test_user_2@example.com' }
    });

    if (!user2) {
      user2 = await prisma.cliente.create({
        data: {
          CodigoCliente: 99992,
          NomeCompleto: 'Test User 2',
          Email: 'test_user_2@example.com',
          SenhaHash: 'hashed_password',
          TipoPessoa: 'FISICA',
          CPF_CNPJ: '555.666.777-88',
          role: 'CLIENTE'
        }
      });
    }

    console.log(`✅ Usuários criados: ${user1.ClienteID} e ${user2.ClienteID}`);

    // Criar produto de teste
    const produto = await prisma.produto.upsert({
      where: { SKU: 'TEST-PRODUCT-001' },
      update: {},
      create: {
        Nome: 'Produto de Teste',
        Descricao: 'Produto para teste de isolamento',
        Preco: 99.99,
        SKU: 'TEST-PRODUCT-001',
        CategoriaID: 1, // Assumindo que existe
        Ativo: true
      }
    });

    console.log(`✅ Produto criado: ${produto.ProdutoID}`);

    // Limpar carrinhos existentes para teste
    await prisma.carrinhoItem.deleteMany({
      where: { ClienteID: { in: [user1.ClienteID, user2.ClienteID] } }
    });

    // Adicionar itens ao carrinho do usuário 1
    await prisma.carrinhoItem.create({
      data: {
        ClienteID: user1.ClienteID,
        ProdutoID: produto.ProdutoID,
        Quantidade: 2
      }
    });

    // Adicionar itens ao carrinho do usuário 2
    await prisma.carrinhoItem.create({
      data: {
        ClienteID: user2.ClienteID,
        ProdutoID: produto.ProdutoID,
        Quantidade: 3
      }
    });

    console.log('✅ Itens adicionados aos carrinhos');

    // Verificar isolamento
    const cartUser1 = await prisma.carrinhoItem.findMany({
      where: { ClienteID: user1.ClienteID }
    });

    const cartUser2 = await prisma.carrinhoItem.findMany({
      where: { ClienteID: user2.ClienteID }
    });

    console.log(`\n📊 Carrinho Usuário 1 (${user1.ClienteID}):`);
    cartUser1.forEach(item => {
      console.log(`  - Produto ${item.ProdutoID}: ${item.Quantidade} unidades`);
    });

    console.log(`\n📊 Carrinho Usuário 2 (${user2.ClienteID}):`);
    cartUser2.forEach(item => {
      console.log(`  - Produto ${item.ProdutoID}: ${item.Quantidade} unidades`);
    });

    // Verificar se há isolamento
    const user1HasCorrectItems = cartUser1.length === 1 && cartUser1[0].Quantidade === 2;
    const user2HasCorrectItems = cartUser2.length === 1 && cartUser2[0].Quantidade === 3;

    if (user1HasCorrectItems && user2HasCorrectItems) {
      console.log('\n✅ TESTE PASSOU: Isolamento de dados funcionando corretamente!');
    } else {
      console.log('\n❌ TESTE FALHOU: Dados vazando entre usuários!');
    }

    // Limpar dados de teste
    await prisma.carrinhoItem.deleteMany({
      where: { ClienteID: { in: [user1.ClienteID, user2.ClienteID] } }
    });

    console.log('\n🧹 Dados de teste limpos');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testCartIsolation();