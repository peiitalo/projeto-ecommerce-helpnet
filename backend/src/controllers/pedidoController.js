// backend/src/controllers/pedidoController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import paymentService from "../services/paymentService.js";
import { calcularFrete } from "../services/freightService.js";

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

    // Buscar todos os produtos de uma vez para evitar N+1 queries
    const produtoIds = itens.map(item => parseInt(item.produtoId));
    const produtos = await prisma.produto.findMany({
      where: { ProdutoID: { in: produtoIds } }
    });

    // Criar mapa de produtos para acesso rápido
    const produtosMap = new Map(produtos.map(p => [p.ProdutoID, p]));

    // Calcular total e verificar estoque
    let totalItens = 0;
    const itensComPreco = [];

    for (const item of itens) {
      const produto = produtosMap.get(parseInt(item.produtoId));

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

    // Usar o valor de frete enviado pelo frontend (já calculado)
    // Para validação, podemos recalcular e comparar se necessário
    let valorFrete = frete || 0;

    // Opcional: validar frete recalculando (comentado para evitar complexidade)
    // try {
    //   const primeiroProduto = produtosMap.get(parseInt(itens[0].produtoId));
    //   if (primeiroProduto && primeiroProduto.VendedorID) {
    //     const empresa = await prisma.empresa.findUnique({
    //       where: { EmpresaID: primeiroProduto.EmpresaID },
    //       select: { EmpresaID: true }
    //     });
    //     const cepEmpresa = enderecoData.CEP;
    //     const freteResultado = calcularFrete(cepEmpresa, enderecoData.CEP);
    //     const freteCalculado = freteResultado.valorFrete;
    //
    //     // Se o frete enviado divergir muito do calculado, logar mas aceitar
    //     if (Math.abs(freteCalculado - valorFrete) > 0.01) {
    //       logger.warn('frete_divergente', {
    //         freteEnviado: valorFrete,
    //         freteCalculado,
    //         clienteId: user.id
    //       });
    //     }
    //   }
    // } catch (freteError) {
    //   logger.warn('erro_validacao_frete_pedido', {
    //     clienteId: user.id,
    //     error: freteError.message
    //   });
    // }

    // Calcular total dos pagamentos
    const totalPagamentos = metodosPagamento.reduce((total, metodo) => total + parseFloat(metodo.valor), 0);
    const totalPedido = totalItens + valorFrete;

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
      // Criar pedido com expiração e status de pagamento inicial
      const expiracaoHoras = 24; // ajuste para 24h/48h conforme regra
      const expiraEm = new Date();
      expiraEm.setHours(expiraEm.getHours() + expiracaoHoras);

      const pedido = await tx.pedido.create({
        data: {
          ClienteID: user.id,
          EnderecoID: parseInt(enderecoId),
          Total: totalPedido,
          Frete: valorFrete,
          Status: 'AguardandoPagamento',
          StatusPagamento: 'PENDENTE',
          ExpiraEm: expiraEm,
          TotalPago: 0
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

      // Salvar distribuição de pagamento (não cria pagamento ainda)
      for (const metodo of metodosPagamento) {
        // Mapear tipos do frontend para nomes do banco
        const tipoMapeado = {
          'pix': 'PIX',
          'cartao': 'Cartão de Crédito',
          'boleto': 'Boleto Bancário'
        }[metodo.tipo] || metodo.tipo;

        // Verificar se método de pagamento existe (usar prisma global pois métodos são dados estáticos)
        const metodoPagamento = await prisma.metodoPagamento.findFirst({
          where: { Nome: tipoMapeado, Ativo: true }
        });

        if (!metodoPagamento) {
          throw new Error(`Método de pagamento ${metodo.tipo} não encontrado`);
        }

        await tx.distribuicaoPagamentoPedido.create({
          data: {
            PedidoID: pedido.PedidoID,
            MetodoID: metodoPagamento.MetodoID,
            ValorAlocado: parseFloat(metodo.valor),
            ValorPagoAcumulado: 0
          }
        });
      }

      return pedido;
    });

    // Não cria preferências externas aqui. Fluxo será a tela de pagamento interna por método.
    let paymentPreference = null;
    try {
      // Opcionalmente, poderíamos criar preferências individuais por método no futuro.
      await prisma.pedido.update({
        where: { PedidoID: resultado.PedidoID },
        data: { Status: 'PagamentoIniciado' }
      });
    } catch (paymentError) {
      logger.error('erro_configurar_pagamento', {
        pedidoId: resultado.PedidoID,
        error: paymentError.message
      });
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
        frete: valorFrete,
        subtotal: totalItens,
        status: 'PagamentoIniciado',
        // Direcionar o cliente para a tela interna de pagamento do pedido
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/pagamento/${resultado.PedidoID}`,
        sandboxPaymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/pagamento/${resultado.PedidoID}`
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
      if (prisma?.clienteVendedor?.upsert) {
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
      } else {
        await prisma.$executeRaw`INSERT INTO "ClienteVendedor" ("ClienteID","VendedorID","AdicionadoEm","UltimoPedidoEm","TotalPedidos","ValorTotal") VALUES (${clienteId}, ${vendedorId}, NOW(), NOW(), 1, ${dados.valorTotal}) ON CONFLICT ("ClienteID","VendedorID") DO UPDATE SET "UltimoPedidoEm" = EXCLUDED."UltimoPedidoEm", "TotalPedidos" = "ClienteVendedor"."TotalPedidos" + 1, "ValorTotal" = "ClienteVendedor"."ValorTotal" + EXCLUDED."ValorTotal";`;
      }

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
        select: {
          PedidoID: true,
          DataPedido: true,
          Status: true,
          Total: true,
          Frete: true,
          TotalPago: true,
          StatusPagamento: true,
          ExpiraEm: true,
          itensPedido: {
            select: {
              Quantidade: true,
              PrecoUnitario: true,
              produto: {
                select: {
                  ProdutoID: true,
                  Nome: true,
                  Imagens: true,
                  SKU: true
                }
              }
            }
          },
          pagamentosPedido: {
            select: {
              ValorPago: true,
              StatusPagamento: true,
              DataPagamento: true,
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
              UF: true,
              Bairro: true,
              Numero: true
            }
          }
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
      select: {
        PedidoID: true,
        DataPedido: true,
        Status: true,
        Total: true,
        Frete: true,
        TotalPago: true,
        StatusPagamento: true,
        ExpiraEm: true,
        itensPedido: {
          select: {
            Quantidade: true,
            PrecoUnitario: true,
            produto: {
              select: {
                ProdutoID: true,
                Nome: true,
                Imagens: true,
                SKU: true
              }
            }
          }
        },
        pagamentosPedido: {
          select: {
            ValorPago: true,
            StatusPagamento: true,
            DataPagamento: true,
            MetodoPagamento: {
              select: { MetodoID: true, Nome: true }
            }
          }
        },
        Endereco: {
          select: {
            Nome: true,
            Complemento: true,
            CEP: true,
            CodigoIBGE: true,
            Cidade: true,
            UF: true,
            TipoEndereco: true,
            Numero: true,
            Bairro: true
          }
        }
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

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({ error: "Acesso negado. Apenas vendedores podem acessar esta funcionalidade." });
    }

    // Usar o vendedorId do JWT payload
    const vendedorId = user.vendedorId;
    if (!vendedorId) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Buscar empresa do vendedor
    const vendedor = await prisma.vendedor.findUnique({
      where: { VendedorID: vendedorId },
      select: { EmpresaID: true }
    });

    if (!vendedor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Buscar estatísticas filtradas por vendedor para isolamento de dados
    const [totalPedidos, totalClientes] = await prisma.$transaction([
      // Total de pedidos
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: {
                VendedorID: vendedorId
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
                VendedorID: vendedorId
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
      vendedorId,
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

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({ error: "Acesso negado. Apenas vendedores podem acessar esta funcionalidade." });
    }

    // Usar o vendedorId do JWT payload
    const vendedorId = user.vendedorId;
    if (!vendedorId) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Buscar pedidos que contenham produtos do vendedor logado para isolamento de dados
    const [pedidos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where: {
          itensPedido: {
            some: {
              produto: {
                VendedorID: vendedorId
              }
            }
          }
        },
        select: {
          PedidoID: true,
          DataPedido: true,
          Status: true,
          Total: true,
          Frete: true,
          TotalPago: true,
          StatusPagamento: true,
          itensPedido: {
            where: {
              produto: {
                VendedorID: vendedorId
              }
            },
            select: {
              Quantidade: true,
              PrecoUnitario: true,
              produto: {
                select: {
                  ProdutoID: true,
                  Nome: true,
                  Imagens: true,
                  SKU: true
                }
              }
            }
          },
          pagamentosPedido: {
            select: {
              ValorPago: true,
              StatusPagamento: true,
              DataPagamento: true,
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
                VendedorID: vendedorId
              }
            }
          }
        }
      })
    ]);

    logger.info('listar_pedidos_vendedor_ok', { vendedorId, total });
    res.json({ pedidos, total });

  } catch (error) {
    logControllerError('listar_pedidos_vendedor_error', error, req);
    res.status(500).json({ error: "Erro ao listar pedidos do vendedor" });
  }
};