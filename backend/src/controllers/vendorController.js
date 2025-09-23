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