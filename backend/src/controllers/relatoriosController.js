// backend/src/controllers/relatoriosController.js
import prisma from "../config/prisma.js";
import { logger } from '../utils/logger.js';

const logControllerError = (operation, error, req) => {
  logger.error(`relatorios_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    userId: req?.user?.id,
    empresaId: req?.user?.empresaId,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Obter estatísticas gerais do vendedor
export const obterEstatisticasGerais = async (req, res) => {
  try {
    const { user } = req;
    const { dateRange = '30d', category = 'all' } = req.query;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Calcular data de início baseada no range
    const now = new Date();
    let startDate;

    switch (dateRange) {
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

    // Estatísticas de produtos
    const totalProducts = await prisma.produto.count({
      where: {
        EmpresaID: user.empresaId,
        Ativo: true
      }
    });

    // Estatísticas de pedidos
    const categoryFilter = category !== 'all' ? { categoria: { Nome: category } } : {};
    const pedidosStats = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              EmpresaID: user.empresaId,
              ...categoryFilter
            }
          }
        },
        DataPedido: {
          gte: startDate
        }
      },
      select: {
        PedidoID: true,
        Total: true,
        Status: true,
        DataPedido: true,
        itensPedido: {
          select: {
            Quantidade: true,
            produto: {
              select: {
                EmpresaID: true
              }
            }
          }
        }
      }
    });

    // Filtrar apenas pedidos que têm pelo menos um item da empresa
    const pedidosFiltrados = pedidosStats.filter(pedido =>
      pedido.itensPedido.some(item => item.produto.EmpresaID === user.empresaId)
    );

    const totalOrders = pedidosFiltrados.length;
    const totalRevenue = pedidosFiltrados.reduce((acc, pedido) => acc + pedido.Total, 0);

    // Estatísticas de clientes
    const clientesUnicos = new Set();
    pedidosFiltrados.forEach(pedido => {
      clientesUnicos.add(pedido.ClienteID);
    });
    const totalCustomers = clientesUnicos.size;

    // Calcular variações (comparado com período anterior)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const pedidosAnteriores = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              EmpresaID: user.empresaId,
              ...categoryFilter
            }
          }
        },
        DataPedido: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      select: {
        PedidoID: true,
        Total: true,
        itensPedido: {
          select: {
            Quantidade: true,
            produto: {
              select: {
                EmpresaID: true
              }
            }
          }
        }
      }
    });

    const pedidosAnterioresFiltrados = pedidosAnteriores.filter(pedido =>
      pedido.itensPedido.some(item => item.produto.EmpresaID === user.empresaId)
    );

    const previousRevenue = pedidosAnterioresFiltrados.reduce((acc, pedido) => acc + pedido.Total, 0);
    const previousOrders = pedidosAnterioresFiltrados.length;

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    // Variações fixas para clientes e produtos (podem ser calculadas posteriormente)
    const customersChange = 15.2;
    const productsChange = -2.1;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueChange,
        ordersChange,
        customersChange,
        productsChange
      }
    });

  } catch (error) {
    logControllerError('obter_estatisticas_gerais', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter dados de vendas
export const obterDadosVendas = async (req, res) => {
  try {
    const { user } = req;
    const { dateRange = '30d', category = 'all' } = req.query;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Calcular data de início
    const now = new Date();
    let startDate;

    switch (dateRange) {
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

    // Dados diários de vendas
    const categoryFilter = category !== 'all' ? { categoria: { Nome: category } } : {};
    const dailySales = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const pedidosDoDia = await prisma.pedido.findMany({
        where: {
          itensPedido: {
            some: {
              produto: {
                EmpresaID: user.empresaId,
                ...categoryFilter
              }
            }
          },
          DataPedido: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        select: {
          PedidoID: true,
          Total: true,
          itensPedido: {
            select: {
              Quantidade: true,
              produto: {
                select: {
                  EmpresaID: true
                }
              }
            }
          }
        }
      });

      const pedidosFiltrados = pedidosDoDia.filter(pedido =>
        pedido.itensPedido.some(item => item.produto.EmpresaID === user.empresaId)
      );

      const revenue = pedidosFiltrados.reduce((acc, pedido) => acc + pedido.Total, 0);
      const orders = pedidosFiltrados.length;

      dailySales.push({
        date: dayStart.toISOString().split('T')[0],
        revenue,
        orders
      });
    }

    // Top produtos
    const topProducts = await prisma.produto.findMany({
      where: {
        EmpresaID: user.empresaId,
        Ativo: true,
        ...(category !== 'all' && { categoria: { Nome: category } })
      },
      select: {
        ProdutoID: true,
        Nome: true,
        _count: {
          select: {
            itensPedido: {
              where: {
                pedido: {
                  DataPedido: {
                    gte: startDate
                  }
                }
              }
            }
          }
        },
        itensPedido: {
          where: {
            pedido: {
              DataPedido: {
                gte: startDate
              }
            }
          },
          select: {
            Quantidade: true,
            PrecoUnitario: true
          }
        }
      },
      take: 5
    });

    const topProductsFormatted = topProducts.map(produto => {
      const sales = produto.itensPedido.reduce((acc, item) => acc + item.Quantidade, 0);
      const revenue = produto.itensPedido.reduce((acc, item) => acc + (item.Quantidade * item.PrecoUnitario), 0);

      return {
        name: produto.Nome,
        sales,
        revenue
      };
    }).sort((a, b) => b.sales - a.sales);

    res.json({
      success: true,
      sales: {
        daily: dailySales,
        topProducts: topProductsFormatted
      }
    });

  } catch (error) {
    logControllerError('obter_dados_vendas', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter dados de clientes
export const obterDadosClientes = async (req, res) => {
  try {
    const { user } = req;
    const { dateRange = '30d', category = 'all' } = req.query;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Calcular data de início
    const now = new Date();
    let startDate;

    switch (dateRange) {
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

    // Get ClienteIDs who have orders in the period with vendor products
    const categoryFilter = category !== 'all' ? { categoria: { Nome: category } } : {};
    const clientesIds = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              EmpresaID: user.empresaId,
              ...categoryFilter
            }
          }
        },
        DataPedido: {
          gte: startDate
        }
      },
      select: {
        ClienteID: true,
        itensPedido: {
          select: {
            produto: {
              select: {
                EmpresaID: true
              }
            }
          }
        }
      },
      distinct: ['ClienteID']
    });

    const clientesFiltradosIds = clientesIds
      .filter(pedido => pedido.itensPedido.some(item => item.produto.EmpresaID === user.empresaId))
      .map(p => p.ClienteID);

    // Get first order date for these customers
    const firstOrderDates = await prisma.pedido.groupBy({
      by: ['ClienteID'],
      where: {
        ClienteID: {
          in: clientesFiltradosIds
        }
      },
      _min: {
        DataPedido: true
      }
    });

    const newCustomers = firstOrderDates.filter(c => c._min.DataPedido >= startDate).length;
    const returningCustomers = firstOrderDates.filter(c => c._min.DataPedido < startDate).length;

    // Get top customers: sum total and count orders for these customers in the period
    const topCustomersData = await prisma.pedido.groupBy({
      by: ['ClienteID'],
      where: {
        ClienteID: {
          in: clientesFiltradosIds
        },
        DataPedido: {
          gte: startDate
        },
        itensPedido: {
          some: {
            produto: {
              EmpresaID: user.empresaId,
              ...categoryFilter
            }
          }
        }
      },
      _sum: {
        Total: true
      },
      _count: {
        PedidoID: true
      }
    });

    // Get customer names
    const customerNames = await prisma.cliente.findMany({
      where: {
        ClienteID: {
          in: topCustomersData.map(c => c.ClienteID)
        }
      },
      select: {
        ClienteID: true,
        NomeCompleto: true
      }
    });

    const nameMap = new Map(customerNames.map(c => [c.ClienteID, c.NomeCompleto]));

    const topCustomers = topCustomersData
      .map(c => ({
        name: nameMap.get(c.ClienteID) || 'Cliente',
        orders: c._count.PedidoID,
        totalSpent: c._sum.Total
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);

    res.json({
      success: true,
      customers: {
        newCustomers,
        returningCustomers,
        topCustomers
      }
    });

  } catch (error) {
    logControllerError('obter_dados_clientes', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Exportar relatório CSV
export const exportarRelatorio = async (req, res) => {
  try {
    const { user } = req;
    const { dateRange = '30d', category = 'all' } = req.query;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Calcular data de início
    const now = new Date();
    let startDate;

    switch (dateRange) {
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

    // Get orders data for CSV export
    const categoryFilter = category !== 'all' ? { categoria: { Nome: category } } : {};
    const pedidos = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              EmpresaID: user.empresaId,
              ...categoryFilter
            }
          }
        },
        DataPedido: {
          gte: startDate
        }
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
          }
        },
        itensPedido: {
          include: {
            produto: {
              select: {
                Nome: true,
                SKU: true,
                categoria: {
                  select: {
                    Nome: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        DataPedido: 'desc'
      }
    });

    // Filter orders that actually contain vendor products
    const pedidosFiltrados = pedidos.filter(pedido =>
      pedido.itensPedido.some(item => item.produto.EmpresaID === user.empresaId)
    );

    // Generate CSV content
    let csvContent = 'Data Pedido,Cliente,Email,Produto,SKU,Categoria,Quantidade,Preço Unitário,Total Item,Total Pedido\n';

    pedidosFiltrados.forEach(pedido => {
      const dataPedido = new Date(pedido.DataPedido).toLocaleDateString('pt-BR');
      const clienteNome = pedido.cliente?.NomeCompleto || 'Cliente';
      const clienteEmail = pedido.cliente?.Email || '';

      pedido.itensPedido.forEach(item => {
        if (item.produto.EmpresaID === user.empresaId) {
          const linha = [
            dataPedido,
            `"${clienteNome}"`,
            clienteEmail,
            `"${item.produto.Nome}"`,
            item.produto.SKU,
            `"${item.produto.categoria?.Nome || 'N/A'}"`,
            item.Quantidade,
            item.PrecoUnitario.toFixed(2),
            (item.Quantidade * item.PrecoUnitario).toFixed(2),
            pedido.Total.toFixed(2)
          ].join(',');
          csvContent += linha + '\n';
        }
      });
    });

    // Set headers for CSV download
    const fileName = `relatorio_vendas_${dateRange}_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.end(csvContent);

  } catch (error) {
    logControllerError('exportar_relatorio', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};