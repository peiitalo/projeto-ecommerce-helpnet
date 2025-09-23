// backend/src/controllers/pedidoController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import paymentService from "../services/paymentService.js";

export const criarPedido = async (req, res) => {
  try {
    const { user } = req;
    const {
      enderecoId,
      itens,
      metodosPagamento,
      frete = 0,
      observacoes
    } = req.body;

    // Validações
    if (!enderecoId || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["Endereço e itens são obrigatórios"]
      });
    }

    if (!metodosPagamento || !Array.isArray(metodosPagamento) || metodosPagamento.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["Métodos de pagamento são obrigatórios"]
      });
    }

    // Verificar se o endereço pertence ao cliente
    const endereco = await prisma.endereco.findFirst({
      where: { EnderecoID: parseInt(enderecoId), ClienteID: user.id }
    });

    if (!endereco) {
      return res.status(400).json({
        success: false,
        errors: ["Endereço não encontrado"]
      });
    }

    // Calcular total e verificar estoque
    let totalItens = 0;
    const itensComPreco = [];

    for (const item of itens) {
      const produto = await prisma.produto.findUnique({
        where: { ProdutoID: parseInt(item.produtoId) }
      });

      if (!produto) {
        return res.status(400).json({
          success: false,
          errors: [`Produto ${item.produtoId} não encontrado`]
        });
      }

      if (!produto.Ativo) {
        return res.status(400).json({
          success: false,
          errors: [`Produto ${produto.Nome} não está disponível`]
        });
      }

      if (produto.Estoque < item.quantidade) {
        return res.status(400).json({
          success: false,
          errors: [`Estoque insuficiente para ${produto.Nome}`]
        });
      }

      const precoUnitario = produto.Preco;
      const subtotal = precoUnitario * item.quantidade;
      totalItens += subtotal;

      itensComPreco.push({
        produtoId: produto.ProdutoID,
        nome: produto.Nome,
        quantidade: item.quantidade,
        precoUnitario,
        subtotal
      });
    }

    // Calcular total dos pagamentos
    const totalPagamentos = metodosPagamento.reduce((total, metodo) => total + parseFloat(metodo.valor), 0);
    const totalPedido = totalItens + parseFloat(frete);

    if (Math.abs(totalPagamentos - totalPedido) > 0.01) {
      return res.status(400).json({
        success: false,
        errors: [`Total dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) deve ser igual ao total do pedido (R$ ${totalPedido.toFixed(2)})`]
      });
    }

    // Buscar dados do cliente para o pagamento
    const clienteData = await prisma.cliente.findUnique({
      where: { ClienteID: user.id },
      select: {
        NomeCompleto: true,
        Email: true,
        CPF_CNPJ: true
      }
    });

    const enderecoData = await prisma.endereco.findUnique({
      where: { EnderecoID: parseInt(enderecoId) },
      select: {
        CEP: true,
        Cidade: true,
        UF: true,
        Bairro: true,
        Numero: true,
        Complemento: true
      }
    });

    // Criar pedido em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar pedido
      const pedido = await tx.pedido.create({
        data: {
          ClienteID: user.id,
          EnderecoID: parseInt(enderecoId),
          Total: totalPedido,
          Status: 'AguardandoPagamento'
        }
      });

      // Criar itens do pedido
      for (const item of itensComPreco) {
        await tx.itensPedido.create({
          data: {
            PedidoID: pedido.PedidoID,
            ProdutoID: item.produtoId,
            Quantidade: item.quantidade,
            PrecoUnitario: item.precoUnitario
          }
        });

        // Atualizar estoque
        await tx.produto.update({
          where: { ProdutoID: item.produtoId },
          data: { Estoque: { decrement: item.quantidade } }
        });
      }

      // Criar pagamentos com status inicial
      for (const metodo of metodosPagamento) {
        // Mapear tipos do frontend para nomes do banco
        const tipoMapeado = {
          'pix': 'PIX',
          'cartao': 'Cartão de Crédito',
          'boleto': 'Boleto Bancário'
        }[metodo.tipo] || metodo.tipo;

        // Verificar se método de pagamento existe
        const metodoPagamento = await tx.metodoPagamento.findFirst({
          where: { Nome: tipoMapeado, Ativo: true }
        });

        if (!metodoPagamento) {
          throw new Error(`Método de pagamento ${metodo.tipo} não encontrado`);
        }

        await tx.pagamentosPedido.create({
          data: {
            PedidoID: pedido.PedidoID,
            MetodoID: metodoPagamento.MetodoID,
            ValorPago: parseFloat(metodo.valor),
            StatusPagamento: 'AguardandoPagamento'
          }
        });
      }

      return pedido;
    });

    // Criar preferência de pagamento no Mercado Pago
    try {
      const paymentData = {
        id: resultado.PedidoID,
        total: totalPedido,
        cliente: {
          nome: clienteData.NomeCompleto,
          email: clienteData.Email,
          cpf: clienteData.CPF_CNPJ
        },
        itens: itensComPreco,
        endereco: enderecoData,
        metodosPagamento
      };

      const paymentPreference = await paymentService.criarPreferenciaPagamento(paymentData);

      // Atualizar pedido com dados do pagamento
      await prisma.pedido.update({
        where: { PedidoID: resultado.PedidoID },
        data: {
          Status: 'PagamentoIniciado'
        }
      });

      logger.info('pagamento_mercado_pago_criado', {
        pedidoId: resultado.PedidoID,
        preferenceId: paymentPreference.preferenceId
      });

    } catch (paymentError) {
      logger.error('erro_criar_pagamento_mercado_pago', {
        pedidoId: resultado.PedidoID,
        error: paymentError.message
      });

      // Se falhar o pagamento, cancelar o pedido e devolver estoque
      await prisma.$transaction(async (tx) => {
        await tx.pedido.update({
          where: { PedidoID: resultado.PedidoID },
          data: { Status: 'Cancelado' }
        });

        // Devolver itens ao estoque
        for (const item of itensComPreco) {
          await tx.produto.update({
            where: { ProdutoID: item.produtoId },
            data: { Estoque: { increment: item.quantidade } }
          });
        }

        // Cancelar pagamentos
        await tx.pagamentosPedido.updateMany({
          where: { PedidoID: resultado.PedidoID },
          data: { StatusPagamento: 'Cancelado' }
        });
      });

      throw new Error('Erro ao processar pagamento. Pedido cancelado.');
    }

    // Roteamento do pedido para vendedores
    try {
      await rotearPedidoParaVendedores(resultado.PedidoID, user.id, itensComPreco);
    } catch (routeError) {
      logger.error('erro_roteamento_pedido', {
        pedidoId: resultado.PedidoID,
        error: routeError.message
      });
      // Não falhar o pedido por erro de roteamento
    }

    logger.info('criar_pedido_ok', {
      pedidoId: resultado.PedidoID,
      clienteId: user.id,
      total: totalPedido
    });

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: {
        pedidoId: resultado.PedidoID,
        total: totalPedido,
        status: 'PagamentoIniciado',
        paymentUrl: paymentPreference.initPoint,
        sandboxPaymentUrl: paymentPreference.sandboxInitPoint
      }
    });

  } catch (error) {
    logControllerError('criar_pedido_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Função auxiliar para rotear pedido para vendedores
async function rotearPedidoParaVendedores(pedidoId, clienteId, itensComPreco) {
  try {
    // Buscar informações dos produtos e vendedores
    const produtoIds = itensComPreco.map(item => item.produtoId);
    const produtos = await prisma.produto.findMany({
      where: {
        ProdutoID: { in: produtoIds }
      },
      include: {
        vendedor: true
      }
    });

    // Agrupar produtos por vendedor
    const produtosPorVendedor = new Map();
    for (const produto of produtos) {
      if (produto.vendedor) {
        if (!produtosPorVendedor.has(produto.VendedorID)) {
          produtosPorVendedor.set(produto.VendedorID, {
            vendedor: produto.vendedor,
            produtos: [],
            valorTotal: 0
          });
        }

        const itemCorrespondente = itensComPreco.find(item => item.produtoId === produto.ProdutoID);
        if (itemCorrespondente) {
          produtosPorVendedor.get(produto.VendedorID).produtos.push({
            produto: produto,
            quantidade: itemCorrespondente.quantidade,
            precoUnitario: itemCorrespondente.precoUnitario,
            subtotal: itemCorrespondente.subtotal
          });
          produtosPorVendedor.get(produto.VendedorID).valorTotal += itemCorrespondente.subtotal;
        }
      }
    }

    // Para cada vendedor, adicionar cliente à lista e criar notificação
    for (const [vendedorId, dados] of produtosPorVendedor) {
      // Adicionar cliente à lista do vendedor
      await prisma.clienteVendedor.upsert({
        where: {
          ClienteID_VendedorID: {
            ClienteID: clienteId,
            VendedorID: vendedorId
          }
        },
        update: {
          UltimoPedidoEm: new Date(),
          TotalPedidos: { increment: 1 },
          ValorTotal: { increment: dados.valorTotal }
        },
        create: {
          ClienteID: clienteId,
          VendedorID: vendedorId,
          UltimoPedidoEm: new Date(),
          TotalPedidos: 1,
          ValorTotal: dados.valorTotal
        }
      });

      // Criar notificação para o vendedor
      const produtosTexto = dados.produtos.map(p =>
        `${p.produto.Nome} (${p.quantidade}x)`
      ).join(', ');

      await prisma.notificacao.create({
        data: {
          Titulo: 'Novo Pedido Recebido',
          Mensagem: `Você recebeu um novo pedido #${pedidoId} no valor de R$ ${dados.valorTotal.toFixed(2)}. Produtos: ${produtosTexto}`,
          Tipo: 'success',
          VendedorID: vendedorId
        }
      });

      logger.info('pedido_roteado_vendedor', {
        pedidoId,
        vendedorId,
        clienteId,
        valorTotal: dados.valorTotal,
        produtosCount: dados.produtos.length
      });
    }

  } catch (error) {
    logger.error('erro_roteamento_pedido', {
      pedidoId,
      clienteId,
      error: error.message
    });
    throw error;
  }
}

export const listarPedidosCliente = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10 } = req.query;
    const skip = (pagina - 1) * limit;

    const [pedidos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where: { ClienteID: user.id },
        include: {
          itensPedido: {
            include: {
              produto: {
                select: {
                  ProdutoID: true,
                  Nome: true,
                  Imagens: true,
                  SKU: true,
                  VendedorID: true
                }
              }
            }
          },
          pagamentosPedido: {
            include: {
              MetodoPagamento: {
                select: { Nome: true }
              }
            }
          },
          Endereco: true
        },
        orderBy: { DataPedido: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.pedido.count({ where: { ClienteID: user.id } })
    ]);

    logger.info('listar_pedidos_cliente_ok', { clienteId: user.id, total });
    res.json({ pedidos, total });

  } catch (error) {
    logControllerError('listar_pedidos_cliente_error', error, req);
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};

export const buscarPedidoPorId = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(id),
        ClienteID: user.id
      },
      include: {
        itensPedido: {
          include: {
            produto: {
              select: {
                ProdutoID: true,
                Nome: true,
                Imagens: true,
                SKU: true,
                VendedorID: true
              }
            }
          }
        },
        pagamentosPedido: {
          include: {
            MetodoPagamento: true
          }
        },
        Endereco: true
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado"]
      });
    }

    logger.info('buscar_pedido_ok', { pedidoId: id, clienteId: user.id });
    res.json({ success: true, pedido });

  } catch (error) {
    logControllerError('buscar_pedido_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(id),
        ClienteID: user.id
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado"]
      });
    }

    if (pedido.Status !== 'Pendente') {
      return res.status(400).json({
        success: false,
        errors: ["Não é possível cancelar um pedido que não está pendente"]
      });
    }

    // Cancelar pedido e devolver estoque
    await prisma.$transaction(async (tx) => {
      // Atualizar status do pedido
      await tx.pedido.update({
        where: { PedidoID: parseInt(id) },
        data: { Status: 'Cancelado' }
      });

      // Devolver itens ao estoque
      const itensPedido = await tx.itensPedido.findMany({
        where: { PedidoID: parseInt(id) }
      });

      for (const item of itensPedido) {
        await tx.produto.update({
          where: { ProdutoID: item.ProdutoID },
          data: { Estoque: { increment: item.Quantidade } }
        });
      }

      // Cancelar pagamentos
      await tx.pagamentosPedido.updateMany({
        where: { PedidoID: parseInt(id) },
        data: { StatusPagamento: 'Cancelado' }
      });
    });

    logger.info('cancelar_pedido_ok', { pedidoId: id, clienteId: user.id });
    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    });

  } catch (error) {
    logControllerError('cancelar_pedido_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Funções para vendedores
export const obterEstatisticasDashboardVendedor = async (req, res) => {
  try {
    const { user } = req;

    // Buscar empresa do vendedor
    const vendedor = await prisma.vendedor.findUnique({
      where: { VendedorID: user.id },
      select: { EmpresaID: true }
    });

    if (!vendedor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Buscar estatísticas
    const [totalPedidos, totalClientes] = await prisma.$transaction([
      // Total de pedidos
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: {
                EmpresaID: vendedor.EmpresaID
              }
            }
          }
        }
      }),
      // Total de clientes distintos que compraram
      prisma.pedido.findMany({
        where: {
          itensPedido: {
            some: {
              produto: {
                EmpresaID: vendedor.EmpresaID
              }
            }
          }
        },
        select: {
          ClienteID: true
        },
        distinct: ['ClienteID']
      }).then(result => result.length)
    ]);

    logger.info('estatisticas_dashboard_vendedor_ok', {
      vendedorId: user.id,
      totalPedidos,
      totalClientes
    });

    res.json({
      success: true,
      stats: {
        totalOrders: totalPedidos,
        totalCustomers: totalClientes
      }
    });

  } catch (error) {
    logControllerError('estatisticas_dashboard_vendedor_error', error, req);
    res.status(500).json({ error: "Erro ao obter estatísticas do dashboard" });
  }
};

export const listarPedidosVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10 } = req.query;
    const skip = (pagina - 1) * limit;

    // Buscar empresa do vendedor
    const vendedor = await prisma.vendedor.findUnique({
      where: { VendedorID: user.id },
      select: { EmpresaID: true }
    });

    if (!vendedor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Buscar pedidos que contenham produtos da empresa do vendedor
    const [pedidos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where: {
          itensPedido: {
            some: {
              produto: {
                EmpresaID: vendedor.EmpresaID
              }
            }
          }
        },
        include: {
          itensPedido: {
            include: {
              produto: {
                select: {
                  ProdutoID: true,
                  Nome: true,
                  Imagens: true,
                  SKU: true,
                  EmpresaID: true
                }
              }
            }
          },
          pagamentosPedido: {
            include: {
              MetodoPagamento: {
                select: { Nome: true }
              }
            }
          },
          Endereco: {
            select: {
              Nome: true,
              CEP: true,
              Cidade: true,
              UF: true
            }
          },
          cliente: {
            select: {
              NomeCompleto: true,
              Email: true
            }
          }
        },
        orderBy: { DataPedido: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: {
                EmpresaID: vendedor.EmpresaID
              }
            }
          }
        }
      })
    ]);

    logger.info('listar_pedidos_vendedor_ok', { vendedorId: user.id, total });
    res.json({ pedidos, total });

  } catch (error) {
    logControllerError('listar_pedidos_vendedor_error', error, req);
    res.status(500).json({ error: "Erro ao listar pedidos do vendedor" });
  }
};