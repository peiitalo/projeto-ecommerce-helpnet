// backend/src/controllers/pedidoController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import paymentService from "../services/paymentService.js";
import { calcularFrete } from "../services/freightService.js";
import { sendOrderConfirmationEmail, sendDeliveryStatusEmail, sendVendorNewSaleEmail } from "../services/emailService.js";

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

    // Validar métodos de pagamento antes da transação (evita timeout do pool de conexões)
    const metodosValidados = [];
    for (const metodo of metodosPagamento) {
      // Mapear tipos do frontend para nomes do banco
      const tipoMapeado = {
        'pix': 'PIX',
        'cartao': 'Cartão de Crédito',
        'debito': 'Cartão de Débito',
        'boleto': 'Boleto Bancário'
      }[metodo.tipo] || metodo.tipo;

      // Verificar se método de pagamento existe
      const metodoPagamento = await prisma.metodoPagamento.findFirst({
        where: { Nome: tipoMapeado, Ativo: true }
      });

      if (!metodoPagamento) {
        return res.status(400).json({
          success: false,
          errors: [`Método de pagamento ${metodo.tipo} não encontrado`]
        });
      }

      metodosValidados.push({
        metodoPagamento,
        valor: parseFloat(metodo.valor)
      });
    }

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

      // Salvar distribuição de pagamento (usando métodos já validados)
      for (const metodoValidado of metodosValidados) {
        await tx.distribuicaoPagamentoPedido.create({
          data: {
            PedidoID: pedido.PedidoID,
            MetodoID: metodoValidado.metodoPagamento.MetodoID,
            ValorAlocado: metodoValidado.valor,
            ValorPagoAcumulado: 0
          }
        });
      }

      return pedido;
    }, { timeout: 15000 }); // Increase timeout to 15 seconds

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

    // Enviar email de confirmação de pedido
    try {
      await sendOrderConfirmationEmail({
        clienteNome: clienteData.NomeCompleto,
        email: clienteData.Email,
        pedidoId: resultado.PedidoID,
        dataPedido: new Date().toLocaleDateString('pt-BR'),
        metodoPagamento: metodosPagamento.map(m => m.tipo).join(', '),
        enderecoEntrega: `${enderecoData.Cidade}, ${enderecoData.UF}`,
        produtos: itensComPreco.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toFixed(2),
          subtotal: item.subtotal.toFixed(2)
        })),
        subtotal: totalItens.toFixed(2),
        frete: valorFrete.toFixed(2),
        total: totalPedido.toFixed(2)
      });
      logger.info('email_confirmacao_pedido_enviado', { pedidoId: resultado.PedidoID });
    } catch (emailError) {
      logger.warn('erro_email_confirmacao_pedido', { pedidoId: resultado.PedidoID, error: emailError.message });
      // Não falhar o pedido por erro no email
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
    console.error('Erro ao criar pedido:', error.message);
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

      // Enviar email para o vendedor sobre nova venda
      try {
        await sendVendorNewSaleEmail({
          vendedorNome: dados.vendedor.Nome,
          email: dados.vendedor.Email,
          pedidoId,
          dataPedido: new Date().toLocaleDateString('pt-BR'),
          produtos: dados.produtos.map(p => ({
            nome: p.produto.Nome,
            quantidade: p.quantidade,
            precoUnitario: p.precoUnitario.toFixed(2),
            subtotal: p.subtotal.toFixed(2)
          })),
          valorTotal: dados.valorTotal.toFixed(2)
        });
        logger.info('email_nova_venda_enviado', { pedidoId, vendedorId });
      } catch (emailError) {
        logger.warn('erro_email_nova_venda', { pedidoId, vendedorId, error: emailError.message });
        // Não falhar o pedido por erro no email
      }

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

// Funções para administradores
export const listarPedidosAdmin = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, status, cliente, dataInicio, dataFim } = req.query;
    const skip = (pagina - 1) * limit;

    // Verificar se o usuário é administrador
    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas administradores podem acessar esta funcionalidade."]
      });
    }

    // Construir filtros
    const whereClause = {};

    if (status) {
      whereClause.Status = status;
    }

    if (cliente) {
      whereClause.ClienteID = parseInt(cliente);
    }

    if (dataInicio || dataFim) {
      whereClause.DataPedido = {};
      if (dataInicio) {
        whereClause.DataPedido.gte = new Date(dataInicio);
      }
      if (dataFim) {
        whereClause.DataPedido.lte = new Date(dataFim);
      }
    }

    const [pedidos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where: whereClause,
        select: {
          PedidoID: true,
          DataPedido: true,
          Status: true,
          Total: true,
          Frete: true,
          TotalPago: true,
          StatusPagamento: true,
          ExpiraEm: true,
          cliente: {
            select: {
              NomeCompleto: true,
              Email: true
            }
          },
          itensPedido: {
            select: {
              Quantidade: true,
              PrecoUnitario: true,
              produto: {
                select: {
                  Nome: true,
                  SKU: true,
                  vendedor: {
                    select: {
                      Nome: true
                    }
                  }
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
          }
        },
        orderBy: { DataPedido: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.pedido.count({ where: whereClause })
    ]);

    logger.info('listar_pedidos_admin_ok', { adminId: user.id, total });
    res.json({
      success: true,
      pedidos,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_pedidos_admin_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro ao listar pedidos"]
    });
  }
};

export const atualizarStatusPedidoAdmin = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { status, observacoes } = req.body;

    // Verificar se o usuário é administrador
    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas administradores podem alterar status de pedidos."]
      });
    }

    // Validar status
    const statusValidos = [
      'AguardandoPagamento', 'PagamentoIniciado', 'Pago', 'EmProcessamento',
      'Enviado', 'Entregue', 'Cancelado', 'Reembolsado'
    ];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        errors: [`Status inválido. Valores permitidos: ${statusValidos.join(', ')}`]
      });
    }

    // Buscar pedido
    const pedido = await prisma.pedido.findUnique({
      where: { PedidoID: parseInt(id) },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
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

    // Atualizar status do pedido
    const pedidoAtualizado = await prisma.pedido.update({
      where: { PedidoID: parseInt(id) },
      data: { Status: status }
    });

    // Criar notificação para o cliente sobre a mudança de status
    await prisma.notificacao.create({
      data: {
        Titulo: 'Status do Pedido Atualizado',
        Mensagem: `O status do seu pedido #${id} foi alterado para: ${getStatusDescription(status)}${observacoes ? `. Observações: ${observacoes}` : ''}`,
        Tipo: 'info',
        ClienteID: pedido.ClienteID
      }
    });

    // Enviar email de atualização de status para o cliente
    try {
      await sendDeliveryStatusEmail({
        clienteNome: pedido.cliente.NomeCompleto,
        email: pedido.cliente.Email,
        pedidoId: id,
        status: getStatusDescription(status),
        dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
        showTrackingButton: ['Enviado', 'EmProcessamento', 'Entregue'].includes(status),
        isDelivered: status === 'Entregue'
      });
      logger.info('email_status_pedido_admin_enviado', { pedidoId: id, status });
    } catch (emailError) {
      logger.warn('erro_email_status_pedido_admin', { pedidoId: id, status, error: emailError.message });
      // Não falhar a atualização por erro no email
    }

    // Se o pedido foi cancelado, devolver itens ao estoque
    if (status === 'Cancelado' && pedido.Status !== 'Cancelado') {
      const itensPedido = await prisma.itensPedido.findMany({
        where: { PedidoID: parseInt(id) }
      });

      for (const item of itensPedido) {
        await prisma.produto.update({
          where: { ProdutoID: item.ProdutoID },
          data: { Estoque: { increment: item.Quantidade } }
        });
      }
    }

    logger.info('atualizar_status_pedido_admin_ok', {
      adminId: user.id,
      pedidoId: id,
      statusAnterior: pedido.Status,
      statusNovo: status
    });

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      pedido: pedidoAtualizado
    });

  } catch (error) {
    logControllerError('atualizar_status_pedido_admin_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const buscarPedidoAdmin = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Verificar se o usuário é administrador
    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas administradores podem acessar esta funcionalidade."]
      });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { PedidoID: parseInt(id) },
      select: {
        PedidoID: true,
        DataPedido: true,
        Status: true,
        Total: true,
        Frete: true,
        TotalPago: true,
        StatusPagamento: true,
        ExpiraEm: true,
        cliente: {
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true,
            CPF_CNPJ: true
          }
        },
        itensPedido: {
          select: {
            Quantidade: true,
            PrecoUnitario: true,
            produto: {
              select: {
                ProdutoID: true,
                Nome: true,
                SKU: true,
                vendedor: {
                  select: {
                    Nome: true
                  }
                }
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
            Complemento: true,
            CEP: true,
            Cidade: true,
            UF: true,
            Bairro: true,
            Numero: true
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

    logger.info('buscar_pedido_admin_ok', { adminId: user.id, pedidoId: id });
    res.json({
      success: true,
      pedido
    });

  } catch (error) {
    logControllerError('buscar_pedido_admin_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Função auxiliar para descrições de status
function getStatusDescription(status) {
  const descriptions = {
    'AguardandoPagamento': 'Aguardando pagamento',
    'PagamentoIniciado': 'Pagamento iniciado',
    'Pago': 'Pago',
    'EmProcessamento': 'Em processamento',
    'Enviado': 'Enviado',
    'Entregue': 'Entregue',
    'Cancelado': 'Cancelado',
    'Reembolsado': 'Reembolsado'
  };
  return descriptions[status] || status;
}