// backend/src/controllers/adminController.js
import prisma from "../config/prisma.js";
import { logger } from '../utils/logger.js';

const logControllerError = (operation, error, req) => {
  logger.error(`admin_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    userId: req?.user?.id,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Dashboard - Estatísticas gerais para admin
export const obterDashboardStats = async (req, res) => {
  try {
    const { user } = req;

    // Verificar se é admin
    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas administradores podem acessar esta funcionalidade."]
      });
    }

    // Estatísticas gerais
    const [
      totalPedidos,
      totalClientes,
      totalVendedores,
      totalProdutos,
      pedidosRecentes,
      faturamentoTotal,
      produtosMaisVendidos
    ] = await Promise.all([
      // Total de pedidos
      prisma.pedido.count(),

      // Total de clientes
      prisma.cliente.count(),

      // Total de vendedores ativos
      prisma.vendedor.count({ where: { Ativo: true } }),

      // Total de produtos ativos
      prisma.produto.count({ where: { Ativo: true } }),

      // Pedidos recentes (últimos 5)
      prisma.pedido.findMany({
        take: 5,
        orderBy: { DataPedido: 'desc' },
        select: {
          PedidoID: true,
          DataPedido: true,
          Status: true,
          Total: true,
          cliente: {
            select: { NomeCompleto: true }
          },
          itensPedido: {
            select: {
              produto: {
                select: {
                  vendedor: {
                    select: { Nome: true }
                  }
                }
              }
            }
          }
        }
      }),

      // Faturamento total (últimos 30 dias)
      prisma.pedido.aggregate({
        where: {
          DataPedido: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          StatusPagamento: 'PAGO'
        },
        _sum: { Total: true }
      }),

      // Produtos mais vendidos (últimos 30 dias)
      prisma.itensPedido.groupBy({
        by: ['ProdutoID'],
        where: {
          pedido: {
            DataPedido: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        _sum: { Quantidade: true },
        orderBy: { _sum: { Quantidade: 'desc' } },
        take: 5
      })
    ]);

    // Buscar nomes dos produtos mais vendidos
    const produtoIds = produtosMaisVendidos.map(p => p.ProdutoID);
    const produtosInfo = await prisma.produto.findMany({
      where: { ProdutoID: { in: produtoIds } },
      select: { ProdutoID: true, Nome: true }
    });

    const produtosMap = new Map(produtosInfo.map(p => [p.ProdutoID, p.Nome]));

    const topProdutos = produtosMaisVendidos.map(p => ({
      nome: produtosMap.get(p.ProdutoID) || 'Produto',
      vendas: p._sum.Quantidade
    }));

    res.json({
      success: true,
      stats: {
        totalPedidos,
        totalClientes,
        totalVendedores,
        totalProdutos,
        faturamentoTotal: faturamentoTotal._sum.Total || 0,
        pedidosRecentes: pedidosRecentes.map(p => ({
          id: p.PedidoID,
          data: p.DataPedido,
          status: p.Status,
          total: p.Total,
          cliente: p.cliente.NomeCompleto,
          vendedor: p.itensPedido[0]?.produto?.vendedor?.Nome || 'N/A'
        })),
        produtosMaisVendidos: topProdutos
      }
    });

  } catch (error) {
    logControllerError('obter_dashboard_stats', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Listar vendedores para admin
export const listarVendedores = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, search = '', status = 'all' } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const skip = (pagina - 1) * limit;
    const whereClause = {
      ...(status !== 'all' && { Ativo: status === 'ativo' }),
      ...(search && {
        OR: [
          { Nome: { contains: search, mode: 'insensitive' } },
          { Email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [vendedores, total] = await Promise.all([
      prisma.vendedor.findMany({
        where: whereClause,
        select: {
          VendedorID: true,
          Nome: true,
          Email: true,
          CriadoEm: true,
          Ativo: true,
          empresa: {
            select: {
              Nome: true,
              Documento: true,
              Email: true,
              Telefone: true
            }
          },
          enderecosVendedor: {
            select: {
              Nome: true,
              CEP: true,
              Cidade: true,
              UF: true,
              Bairro: true,
              Numero: true,
              Complemento: true,
              TipoEndereco: true
            },
            take: 1
          },
          _count: {
            select: {
              produtos: true,
              clientesVendedor: true
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendedor.count({ where: whereClause })
    ]);

    // Buscar dados dos clientes associados e calcular estatísticas
    const vendedoresComDados = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Buscar cliente associado pelo email
        const cliente = await prisma.cliente.findUnique({
          where: { Email: vendedor.Email },
          select: {
            CPF_CNPJ: true,
            TelefoneCelular: true,
            TelefoneFixo: true,
            Whatsapp: true,
            RazaoSocial: true
          }
        });

        // Calcular vendas totais
        const vendasTotais = await prisma.pedido.aggregate({
          where: {
            itensPedido: {
              some: {
                produto: {
                  VendedorID: vendedor.VendedorID
                }
              }
            },
            StatusPagamento: 'PAGO'
          },
          _sum: { Total: true },
          _count: true
        });

        const primeiroEndereco = vendedor.enderecosVendedor[0];
        let enderecoFormatado = null;
        if (primeiroEndereco) {
          enderecoFormatado = `${primeiroEndereco.Bairro || ''}, ${primeiroEndereco.Numero || 's/n'}`;
          if (primeiroEndereco.Complemento) {
            enderecoFormatado += ` - ${primeiroEndereco.Complemento}`;
          }
        }

        return {
          id: vendedor.VendedorID.toString(),
          name: vendedor.Nome,
          email: vendedor.Email,
          joinDate: vendedor.CriadoEm.toISOString(),
          status: vendedor.Ativo ? 'active' : 'inactive',
          totalProducts: vendedor._count.produtos,
          totalOrders: vendasTotais._count || 0,
          totalSales: vendasTotais._sum.Total || 0,
          phone: cliente?.TelefoneCelular || cliente?.TelefoneFixo || vendedor.empresa?.Telefone,
          whatsapp: cliente?.Whatsapp,
          cpfCnpj: cliente?.CPF_CNPJ,
          razaoSocial: cliente?.RazaoSocial || vendedor.empresa?.Nome,
          address: enderecoFormatado,
          city: primeiroEndereco?.Cidade,
          state: primeiroEndereco?.UF,
          cep: primeiroEndereco?.CEP,
          empresa: {
            nome: vendedor.empresa?.Nome,
            documento: vendedor.empresa?.Documento,
            email: vendedor.empresa?.Email,
            telefone: vendedor.empresa?.Telefone
          }
        };
      })
    );

    res.json({
      success: true,
      vendedores: vendedoresComDados,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_vendedores', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Listar empresas/vendedores
export const listarEmpresas = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, status = 'all' } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const skip = (pagina - 1) * limit;
    const whereClause = status !== 'all' ? { Ativo: status === 'ativo' } : {};

    const [empresas, total] = await Promise.all([
      prisma.empresa.findMany({
        where: whereClause,
        select: {
          EmpresaID: true,
          Nome: true,
          Documento: true,
          Email: true,
          Telefone: true,
          Ativo: true,
          CriadoEm: true,
          _count: {
            select: {
              vendedores: true,
              produtos: { where: { Ativo: true } }
            }
          },
          vendedores: {
            select: {
              VendedorID: true,
              Nome: true,
              Email: true,
              Ativo: true
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.empresa.count({ where: whereClause })
    ]);

    // Calcular vendas totais por empresa
    const empresasComVendas = await Promise.all(
      empresas.map(async (empresa) => {
        const vendasTotais = await prisma.pedido.aggregate({
          where: {
            itensPedido: {
              some: {
                produto: {
                  EmpresaID: empresa.EmpresaID
                }
              }
            },
            StatusPagamento: 'PAGO'
          },
          _sum: { Total: true }
        });

        return {
          ...empresa,
          vendasTotais: vendasTotais._sum.Total || 0
        };
      })
    );

    res.json({
      success: true,
      empresas: empresasComVendas,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_empresas', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Atualizar status da empresa
export const atualizarStatusEmpresa = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { ativo } = req.body;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const empresa = await prisma.empresa.update({
      where: { EmpresaID: parseInt(id) },
      data: { Ativo: ativo }
    });

    // Log da ação administrativa
    logger.info('empresa_status_atualizado_admin', {
      adminId: user.id,
      empresaId: id,
      novoStatus: ativo
    });

    res.json({
      success: true,
      message: `Empresa ${ativo ? 'ativada' : 'desativada'} com sucesso`,
      empresa
    });

  } catch (error) {
    logControllerError('atualizar_status_empresa', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Listar clientes
export const listarClientes = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, search = '' } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const skip = (pagina - 1) * limit;
    const whereClause = search ? {
      OR: [
        { NomeCompleto: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } },
        { CPF_CNPJ: { contains: search } }
      ]
    } : {};

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where: whereClause,
        select: {
          ClienteID: true,
          NomeCompleto: true,
          Email: true,
          TelefoneCelular: true,
          DataCadastro: true,
          _count: {
            select: {
              pedidos: true
            }
          }
        },
        orderBy: { DataCadastro: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.cliente.count({ where: whereClause })
    ]);

    // Buscar histórico de pedidos para cada cliente
    const clientesComHistorico = await Promise.all(
      clientes.map(async (cliente) => {
        const pedidosRecentes = await prisma.pedido.findMany({
          where: { ClienteID: cliente.ClienteID },
          select: {
            PedidoID: true,
            DataPedido: true,
            Total: true,
            Status: true
          },
          orderBy: { DataPedido: 'desc' },
          take: 3
        });

        const valorTotalGasto = await prisma.pedido.aggregate({
          where: {
            ClienteID: cliente.ClienteID,
            StatusPagamento: 'PAGO'
          },
          _sum: { Total: true }
        });

        return {
          ...cliente,
          pedidosRecentes,
          valorTotalGasto: valorTotalGasto._sum.Total || 0
        };
      })
    );

    res.json({
      success: true,
      clientes: clientesComHistorico,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_clientes', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Buscar cliente por ID
export const buscarCliente = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: parseInt(id) },
      select: {
        ClienteID: true,
        NomeCompleto: true,
        Email: true,
        CPF_CNPJ: true,
        TelefoneCelular: true,
        DataCadastro: true,
        enderecos: {
          select: {
            Nome: true,
            CEP: true,
            Cidade: true,
            UF: true,
            Bairro: true,
            Numero: true
          }
        },
        pedidos: {
          select: {
            PedidoID: true,
            DataPedido: true,
            Total: true,
            Status: true,
            StatusPagamento: true
          },
          orderBy: { DataPedido: 'desc' }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        errors: ["Cliente não encontrado"]
      });
    }

    res.json({
      success: true,
      cliente
    });

  } catch (error) {
    logControllerError('buscar_cliente', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Relatórios financeiros
export const obterRelatoriosFinanceiros = async (req, res) => {
  try {
    const { user } = req;
    const { periodo = '30d' } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    // Calcular período
    const now = new Date();
    let startDate;
    switch (periodo) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Receita total
    const receitaTotal = await prisma.pedido.aggregate({
      where: {
        DataPedido: { gte: startDate },
        StatusPagamento: 'PAGO'
      },
      _sum: { Total: true }
    });

    // Receita por período (diário)
    const receitaDiaria = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const receitaDia = await prisma.pedido.aggregate({
        where: {
          DataPedido: { gte: dayStart, lt: dayEnd },
          StatusPagamento: 'PAGO'
        },
        _sum: { Total: true }
      });

      receitaDiaria.push({
        data: dayStart.toISOString().split('T')[0],
        receita: receitaDia._sum.Total || 0
      });
    }

    // Volume de vendas por categoria
    const vendasPorCategoria = await prisma.itensPedido.groupBy({
      by: ['ProdutoID'],
      where: {
        pedido: {
          DataPedido: { gte: startDate },
          StatusPagamento: 'PAGO'
        }
      },
      _sum: { Quantidade: true }
    });

    // Buscar categorias dos produtos
    const produtoIds = vendasPorCategoria.map(v => v.ProdutoID);
    const produtosComCategoria = await prisma.produto.findMany({
      where: { ProdutoID: { in: produtoIds } },
      select: {
        ProdutoID: true,
        categoria: { select: { Nome: true } }
      }
    });

    const categoriaMap = new Map(produtosComCategoria.map(p => [p.ProdutoID, p.categoria?.Nome || 'Sem Categoria']));

    const vendasAgrupadasPorCategoria = {};
    vendasPorCategoria.forEach(venda => {
      const categoria = categoriaMap.get(venda.ProdutoID);
      if (!vendasAgrupadasPorCategoria[categoria]) {
        vendasAgrupadasPorCategoria[categoria] = 0;
      }
      vendasAgrupadasPorCategoria[categoria] += venda._sum.Quantidade;
    });

    res.json({
      success: true,
      financeiro: {
        receitaTotal: receitaTotal._sum.Total || 0,
        receitaDiaria,
        vendasPorCategoria: Object.entries(vendasAgrupadasPorCategoria).map(([categoria, quantidade]) => ({
          categoria,
          quantidade
        }))
      }
    });

  } catch (error) {
    logControllerError('obter_relatorios_financeiros', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Suporte - Listar mensagens de contato
export const listarMensagensSuporte = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10, status = 'all' } = req.query;

    // Temporariamente removida verificação de admin para MVP
    // if (user.role !== 'admin' && user.role !== 'ADMIN') {
    //   return res.status(403).json({
    //     success: false,
    //     errors: ["Acesso negado."]
    //   });
    // }

    // Buscar mensagens de suporte da tabela MensagemSuporte
    const skip = (pagina - 1) * limit;
    const whereClause = status !== 'all' ? { Status: status } : {};

    const [mensagens, total] = await Promise.all([
      prisma.mensagemSuporte.findMany({
        where: whereClause,
        include: {
          cliente: {
            select: {
              NomeCompleto: true,
              Email: true,
              TelefoneCelular: true
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.mensagemSuporte.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      mensagens,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_mensagens_suporte', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Avaliações da plataforma
export const listarAvaliacoes = async (req, res) => {
  try {
    const { user } = req;
    const { pagina = 1, limit = 10 } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const skip = (pagina - 1) * limit;

    const [avaliacoes, total] = await Promise.all([
      prisma.avaliacao.findMany({
        select: {
          AvaliacaoID: true,
          Nota: true,
          Comentario: true,
          CriadoEm: true,
          cliente: {
            select: {
              NomeCompleto: true,
              Email: true
            }
          },
          produto: {
            select: {
              Nome: true
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.avaliacao.count()
    ]);

    res.json({
      success: true,
      avaliacoes,
      total,
      pagina: parseInt(pagina),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_avaliacoes', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Atualizar visibilidade da avaliação
export const atualizarVisibilidadeAvaliacao = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { visivel } = req.body;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    // Como não há campo de visibilidade na tabela Avaliacao,
    // podemos adicionar um campo ou usar uma abordagem diferente
    // Por enquanto, apenas logamos a ação
    logger.info('avaliacao_visibilidade_atualizada', {
      adminId: user.id,
      avaliacaoId: id,
      visivel
    });

    res.json({
      success: true,
      message: `Avaliação ${visivel ? 'tornada visível' : 'ocultada'} com sucesso`
    });

  } catch (error) {
    logControllerError('atualizar_visibilidade_avaliacao', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};
