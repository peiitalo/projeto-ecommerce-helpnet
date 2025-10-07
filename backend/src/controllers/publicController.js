// backend/src/controllers/publicController.js
import prisma from "../config/prisma.js";
import { logger } from '../utils/logger.js';

const logControllerError = (operation, error, req) => {
  logger.error(`public_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Obter estatísticas públicas para landing page
export const obterEstatisticasPublicas = async (req, res) => {
  try {
    // Total de produtos ativos
    const totalProdutos = await prisma.produto.count({
      where: { Ativo: true }
    });

    // Total de clientes
    const totalClientes = await prisma.cliente.count();

    // Total de vendedores ativos
    const totalVendedores = await prisma.vendedor.count({
      where: { Ativo: true }
    });

    // Total de pedidos
    const totalPedidos = await prisma.pedido.count();

    res.json({
      success: true,
      stats: {
        totalProdutos,
        totalClientes,
        totalVendedores,
        totalPedidos
      }
    });

  } catch (error) {
    logControllerError('obter_estatisticas_publicas', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter depoimentos para landing page
export const obterDepoimentos = async (req, res) => {
  try {
    // Buscar avaliações com 5 estrelas, incluindo nome do cliente
    const depoimentos = await prisma.avaliacao.findMany({
      where: {
        Nota: 5,
        Comentario: {
          not: null
        }
      },
      select: {
        Comentario: true,
        cliente: {
          select: {
            NomeCompleto: true
          }
        }
      },
      take: 3,
      orderBy: {
        CriadoEm: 'desc'
      }
    });

    // Formatar para o frontend
    const depoimentosFormatados = depoimentos.map(dep => ({
      nome: dep.cliente.NomeCompleto,
      comentario: dep.Comentario,
      estrelas: 5,
      tipo: "Cliente Verificado"
    }));

    res.json({
      success: true,
      depoimentos: depoimentosFormatados
    });

  } catch (error) {
    logControllerError('obter_depoimentos', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};