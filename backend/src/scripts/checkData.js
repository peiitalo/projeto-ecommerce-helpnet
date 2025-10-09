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
    clientes.forEach(cliente => console.log(`  - ${cliente.ClienteID}: ${cliente.NomeCompleto || 'No name'} (${cliente.Role})`));

    const vendedores = await prisma.vendedor.findMany();
    console.log(`\nVendors (${vendedores.length}):`);
    vendedores.forEach(vendedor => console.log(`  - ${vendedor.VendedorID}: ${vendedor.Nome} (${vendedor.Ativo ? 'Active' : 'Inactive'})`));

    const empresas = await prisma.empresa.findMany();
    console.log(`\nCompanies (${empresas.length}):`);
    empresas.forEach(empresa => console.log(`  - ${empresa.EmpresaID}: ${empresa.Nome} (${empresa.Ativo ? 'Active' : 'Inactive'})`));

    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: { select: { NomeCompleto: true } },
        itensPedido: { include: { produto: { select: { Nome: true } } } },
        pagamentosPedido: true
      },
      orderBy: { DataPedido: 'desc' }
    });
    console.log(`\nOrders (${pedidos.length}):`);
    pedidos.forEach(pedido => {
      const date = new Date(pedido.DataPedido).toLocaleDateString('pt-BR');
      console.log(`  - Order ${pedido.PedidoID}: ${date} - ${pedido.cliente?.NomeCompleto || 'Unknown'} - Total: R$${pedido.Total} - Status: ${pedido.StatusPagamento} - Items: ${pedido.itensPedido.length} - Payments: ${pedido.pagamentosPedido.length}`);
    });

    const pagamentos = await prisma.pagamentosPedido.findMany({
      include: {
        pedido: { select: { PedidoID: true, Total: true } },
        MetodoPagamento: { select: { Nome: true } }
      }
    });
    console.log(`\nPayments (${pagamentos.length}):`);
    pagamentos.forEach(pag => {
      console.log(`  - Payment ${pag.PagamentoID}: Order ${pag.pedido?.PedidoID} - Value: R$${pag.ValorPago} - Method: ${pag.MetodoPagamento?.Nome} - Status: ${pag.StatusPagamento}`);
    });

    const metodosPagamento = await prisma.metodoPagamento.findMany();
    console.log(`\nPayment Methods (${metodosPagamento.length}):`);
    metodosPagamento.forEach(metodo => console.log(`  - ${metodo.MetodoID}: ${metodo.Nome} (${metodo.Ativo ? 'Active' : 'Inactive'})`));

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();