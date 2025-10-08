// backend/src/controllers/vendorController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';

export const dashboard = async (req, res) => {
  try {
    const { user } = req;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({ error: "Acesso negado. Apenas vendedores podem acessar esta funcionalidade." });
    }

    // Usar o vendedorId do JWT payload
    const vendedorId = user.vendedorId;
    if (!vendedorId) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Métricas do vendedor
    const [productsCount, activeProductsCount, ordersCount, revenue, clientsCount] = await Promise.all([
      // Total de produtos do vendedor
      prisma.produto.count({ where: { VendedorID: vendedorId } }),

      // Produtos ativos
      prisma.produto.count({ where: { VendedorID: vendedorId, Ativo: true } }),

      // Total de pedidos (onde há produtos do vendedor)
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          }
        }
      }),

      // Receita total
      prisma.pedido.aggregate({
        _sum: { Total: true },
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          },
          Status: 'Pago' // Apenas pedidos pagos
        }
      }),

      // Número de clientes únicos
      prisma.pedido.findMany({
        select: { ClienteID: true },
        distinct: ['ClienteID'],
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          }
        }
      }).then(results => results.length)
    ]);

    res.json({
      produtos: {
        total: productsCount,
        ativos: activeProductsCount
      },
      pedidos: ordersCount,
      receita: revenue._sum.Total || 0,
      clientes: clientsCount
    });
  } catch (error) {
    logControllerError('vendor_dashboard_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar endereços do vendedor
export const listarEnderecos = async (req, res) => {
  try {
    const { user } = req;
    logger.info('listarEnderecos called', { userId: user?.id, vendedorId: user?.vendedorId });

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    const enderecos = await prisma.enderecoVendedor.findMany({
      where: { VendedorID: user.vendedorId },
      orderBy: { Nome: 'asc' }
    });

    res.json({ enderecos });
  } catch (error) {
    logControllerError('vendor_listar_enderecos_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo endereço para o vendedor
export const criarEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { Nome, Complemento, CEP, Cidade, UF, TipoEndereco, Numero, Bairro } = req.body;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Validações
    if (!Nome || !CEP || !Cidade || !UF || !Numero || !Bairro) {
      return res.status(400).json({
        errors: ["Nome, CEP, Cidade, UF, Número e Bairro são obrigatórios"]
      });
    }

    // Verificar se já existe um endereço com o mesmo nome para este vendedor
    const enderecoExistente = await prisma.enderecoVendedor.findFirst({
      where: {
        VendedorID: user.vendedorId,
        Nome: Nome
      }
    });

    if (enderecoExistente) {
      return res.status(400).json({
        errors: ["Já existe um endereço com este nome"]
      });
    }

    const endereco = await prisma.enderecoVendedor.create({
      data: {
        VendedorID: user.vendedorId,
        Nome,
        Complemento: Complemento || null,
        CEP,
        Cidade,
        UF,
        TipoEndereco: TipoEndereco || 'Comercial',
        Numero,
        Bairro
      }
    });

    res.status(201).json({ endereco });
  } catch (error) {
    logControllerError('vendor_criar_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar endereço do vendedor
export const atualizarEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { enderecoId } = req.params;
    const { Nome, Complemento, CEP, Cidade, UF, TipoEndereco, Numero, Bairro } = req.body;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Verificar se o endereço existe e pertence ao vendedor
    const enderecoExistente = await prisma.enderecoVendedor.findFirst({
      where: {
        EnderecoVendedorID: parseInt(enderecoId),
        VendedorID: user.vendedorId
      }
    });

    if (!enderecoExistente) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    // Verificar se já existe outro endereço com o mesmo nome para este vendedor
    if (Nome !== enderecoExistente.Nome) {
      const nomeDuplicado = await prisma.enderecoVendedor.findFirst({
        where: {
          VendedorID: user.vendedorId,
          Nome: Nome,
          EnderecoVendedorID: { not: parseInt(enderecoId) }
        }
      });

      if (nomeDuplicado) {
        return res.status(400).json({
          errors: ["Já existe um endereço com este nome"]
        });
      }
    }

    const endereco = await prisma.enderecoVendedor.update({
      where: { EnderecoVendedorID: parseInt(enderecoId) },
      data: {
        Nome,
        Complemento: Complemento || null,
        CEP,
        Cidade,
        UF,
        TipoEndereco: TipoEndereco || 'Comercial',
        Numero,
        Bairro
      }
    });

    res.json({ endereco });
  } catch (error) {
    logControllerError('vendor_atualizar_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir endereço do vendedor
export const excluirEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { enderecoId } = req.params;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Verificar se o endereço existe e pertence ao vendedor
    const endereco = await prisma.enderecoVendedor.findFirst({
      where: {
        EnderecoVendedorID: parseInt(enderecoId),
        VendedorID: user.vendedorId
      }
    });

    if (!endereco) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    await prisma.enderecoVendedor.delete({
      where: { EnderecoVendedorID: parseInt(enderecoId) }
    });

    res.json({ message: "Endereço excluído com sucesso" });
  } catch (error) {
    logControllerError('vendor_excluir_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter dados financeiros do vendedor
export const getFinanceiro = async (req, res) => {
  try {
    const { user } = req;
    const { periodo = '30d' } = req.query;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate;

    switch (periodo) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Calcular receita bruta: soma dos totais dos pedidos pagos que contenham produtos do vendedor
    const revenueResult = await prisma.pedido.aggregate({
      _sum: { Total: true },
      _count: { PedidoID: true },
      where: {
        StatusPagamento: 'PAGO',
        DataPedido: {
          gte: startDate
        },
        itensPedido: {
          some: {
            produto: { VendedorID: user.vendedorId }
          }
        }
      }
    });

    const receitaBruta = revenueResult._sum.Total || 0;
    const totalOrders = revenueResult._count.PedidoID || 0;

    // Calcular comissões (10% da receita bruta)
    const comissoes = receitaBruta * 0.10;

    // Lucro líquido = receita bruta - comissões (despesas serão adicionadas posteriormente)
    const lucroLiquido = receitaBruta - comissoes;

    // Gerar dados históricos para gráficos (últimos 6 períodos)
    const historicalData = [];
    const periodDays = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365;
    const intervals = 6; // 6 pontos no gráfico

    for (let i = intervals - 1; i >= 0; i--) {
      const periodStart = new Date(now.getTime() - (i + 1) * periodDays * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);

      const periodRevenue = await prisma.pedido.aggregate({
        _sum: { Total: true },
        where: {
          StatusPagamento: 'PAGO',
          DataPedido: {
            gte: periodStart,
            lt: periodEnd
          },
          itensPedido: {
            some: {
              produto: { VendedorID: user.vendedorId }
            }
          }
        }
      });

      const revenue = periodRevenue._sum.Total || 0;
      const expenses = revenue * 0.15; // Mock expenses for now (15% of revenue)

      historicalData.push({
        period: periodStart.toISOString().split('T')[0],
        revenue,
        expenses
      });
    }

    // Dados para gráficos de despesas por categoria (mock para MVP)
    const expensesByCategory = [
      { category: 'Marketing', amount: receitaBruta * 0.05 },
      { category: 'Operações', amount: receitaBruta * 0.04 },
      { category: 'Tecnologia', amount: receitaBruta * 0.03 },
      { category: 'Administrativo', amount: receitaBruta * 0.02 },
      { category: 'Outros', amount: receitaBruta * 0.01 }
    ];

    const financeiro = {
      receitaBruta,
      comissoes,
      lucroLiquido,
      periodo,
      totalOrders,
      historicalData,
      expensesByCategory
    };

    res.json({ financeiro });
  } catch (error) {
    logControllerError('vendor_get_financeiro_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};