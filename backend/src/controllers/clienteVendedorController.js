// backend/src/controllers/clienteVendedorController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";

export const listarClientesVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, search = '' } = req.query;
    const skip = (pagina - 1) * limit;

    // Verificar se usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem acessar esta funcionalidade."]
      });
    }

    // Query distinct ClienteID from Pedido where items are from vendor's products
    let clienteIdsQuery = prisma.pedido.findMany({
      select: { ClienteID: true },
      distinct: ['ClienteID'],
      where: {
        itensPedido: {
          some: {
            produto: { VendedorID: user.vendedorId }
          }
        }
      }
    });

    // If search, filter clients
    let clientesFiltrados = [];
    if (search) {
      // Get all client IDs first, then filter by search
      const allClienteIds = await clienteIdsQuery;
      const clienteIds = allClienteIds.map(c => c.ClienteID);

      const clientesSearch = await prisma.cliente.findMany({
        where: {
          ClienteID: { in: clienteIds },
          OR: [
            { NomeCompleto: { contains: search, mode: 'insensitive' } },
            { Email: { contains: search, mode: 'insensitive' } },
            { CPF_CNPJ: { contains: search } }
          ]
        },
        select: { ClienteID: true }
      });

      clientesFiltrados = clientesSearch.map(c => c.ClienteID);
    } else {
      const allClienteIds = await clienteIdsQuery;
      clientesFiltrados = allClienteIds.map(c => c.ClienteID);
    }

    const total = clientesFiltrados.length;

    // Paginate the client IDs
    const paginatedClienteIds = clientesFiltrados.slice(skip, skip + parseInt(limit));

    // Get client details and statistics
    const clientesComEstatisticas = await Promise.all(
      paginatedClienteIds.map(async (clienteId) => {
        const cliente = await prisma.cliente.findUnique({
          where: { ClienteID: clienteId },
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true,
            CPF_CNPJ: true,
            TelefoneCelular: true,
            DataCadastro: true
          }
        });

        const pedidosCliente = await prisma.pedido.findMany({
          where: {
            ClienteID: clienteId,
            itensPedido: {
              some: {
                produto: {
                  VendedorID: user.vendedorId
                }
              }
            }
          },
          select: {
            PedidoID: true,
            DataPedido: true,
            Total: true,
            Status: true
          },
          orderBy: { DataPedido: 'desc' }
        });

        const valorTotal = pedidosCliente.reduce((sum, pedido) => sum + pedido.Total, 0);
        const pedidosAtivos = pedidosCliente.filter(p => p.Status !== 'Cancelado').length;

        return {
          ClienteID: clienteId,
          cliente,
          estatisticas: {
            totalPedidos: pedidosCliente.length,
            pedidosAtivos,
            valorTotal,
            ultimoPedido: pedidosCliente.length > 0 ? pedidosCliente[0].DataPedido : null
          }
        };
      })
    );

    logger.info('listar_clientes_vendedor_ok', {
      vendedorId: user.vendedorId,
      total,
      pagina,
      limit
    });

    res.json({
      success: true,
      clientes: clientesComEstatisticas,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_clientes_vendedor_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const buscarClienteVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { clienteId } = req.params;

    // Verificar se usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem acessar esta funcionalidade."]
      });
    }

    const clienteVendedor = await prisma.clienteVendedor.findFirst({
      where: {
        ClienteID: parseInt(clienteId),
        VendedorID: user.vendedorId
      },
      include: {
        cliente: {
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true,
            CPF_CNPJ: true,
            TelefoneCelular: true,
            TelefoneFixo: true,
            Whatsapp: true,
            DataCadastro: true,
            enderecos: {
              select: {
                EnderecoID: true,
                Nome: true,
                CEP: true,
                Cidade: true,
                UF: true,
                Bairro: true
              }
            }
          }
        }
      }
    });

    if (!clienteVendedor) {
      return res.status(404).json({
        success: false,
        errors: ["Cliente não encontrado na sua lista de clientes"]
      });
    }

    // Buscar pedidos do cliente com este vendedor
    const pedidos = await prisma.pedido.findMany({
      where: {
        ClienteID: parseInt(clienteId),
        itensPedido: {
          some: {
            produto: {
              VendedorID: user.vendedorId
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
                SKU: true
              }
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
        }
      },
      orderBy: { DataPedido: 'desc' }
    });

    const resposta = {
      ...clienteVendedor,
      pedidos: pedidos.map(pedido => ({
        PedidoID: pedido.PedidoID,
        DataPedido: pedido.DataPedido,
        Status: pedido.Status,
        Total: pedido.Total,
        endereco: pedido.Endereco,
        itens: pedido.itensPedido.map(item => ({
          produto: item.produto,
          quantidade: item.Quantidade,
          precoUnitario: item.PrecoUnitario,
          subtotal: item.PrecoUnitario * item.Quantidade
        }))
      }))
    };

    logger.info('buscar_cliente_vendedor_ok', {
      vendedorId: user.vendedorId,
      clienteId
    });

    res.json({
      success: true,
      cliente: resposta
    });

  } catch (error) {
    logControllerError('buscar_cliente_vendedor_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const obterEstatisticasClientes = async (req, res) => {
  try {
    const { user } = req;

    // Verificar se usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem acessar esta funcionalidade."]
      });
    }

    // Estatísticas gerais
    const [totalClientes, clientesAtivos, totalPedidos, valorTotalVendas] = await prisma.$transaction([
      prisma.clienteVendedor.count({
        where: { VendedorID: user.vendedorId }
      }),
      prisma.clienteVendedor.count({
        where: {
          VendedorID: user.vendedorId,
          UltimoPedidoEm: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
          }
        }
      }),
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: {
                VendedorID: user.vendedorId
              }
            }
          }
        }
      }),
      prisma.pedido.aggregate({
        where: {
          itensPedido: {
            some: {
              produto: {
                VendedorID: user.vendedorId
              }
            }
          }
        },
        _sum: {
          Total: true
        }
      })
    ]);

    // Clientes por período
    const clientesPorMes = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "AdicionadoEm") as mes,
        COUNT(*) as quantidade
      FROM "ClienteVendedor"
      WHERE "VendedorID" = ${user.vendedorId}
      GROUP BY DATE_TRUNC('month', "AdicionadoEm")
      ORDER BY mes DESC
      LIMIT 12
    `;

    res.json({
      success: true,
      estatisticas: {
        totalClientes,
        clientesAtivos,
        totalPedidos,
        valorTotalVendas: valorTotalVendas._sum.Total || 0,
        clientesPorMes
      }
    });

  } catch (error) {
    logControllerError('obter_estatisticas_clientes_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};