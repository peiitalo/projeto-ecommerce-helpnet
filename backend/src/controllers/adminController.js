// backend/src/controllers/adminController.js
import prisma from "../config/prisma.js";
import cryptoService from "../services/cryptoService.js";
import { logger } from "../utils/logger.js";
import jwt from 'jsonwebtoken';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM for server-side usage
const window = new JSDOM('').window;
const DOMPurifyServer = DOMPurify(window);

// Helpers para tokens
const ACCESS_SECRET = process.env.JWT_SECRET || 'seu_segredo';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'seu_segredo_refresh';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';

// Login para administradores
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sanitize inputs
    const sanitizedEmail = DOMPurifyServer.sanitize(email?.toString() || '').trim();
    const sanitizedPassword = password?.toString() || '';

    // Enhanced validation with length limits
    if (!sanitizedEmail || sanitizedEmail.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["Email é obrigatório"]
      });
    }

    if (!sanitizedPassword || sanitizedPassword.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["Senha é obrigatória"]
      });
    }

    // Validate email format and length
    if (sanitizedEmail.length > 254) {
      return res.status(400).json({
        success: false,
        errors: ["Email muito longo"]
      });
    }

    // Validate password length
    if (sanitizedPassword.length > 128) {
      return res.status(400).json({
        success: false,
        errors: ["Senha muito longa"]
      });
    }

    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        errors: ["Formato de email inválido"]
      });
    }

    const admin = await prisma.administrador.findUnique({
      where: { Email: sanitizedEmail }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        errors: ["Credenciais inválidas"]
      });
    }

    if (!admin.Ativo) {
      return res.status(401).json({
        success: false,
        errors: ["Conta desativada"]
      });
    }

    const isPasswordValid = await cryptoService.comparePassword(sanitizedPassword, admin.SenhaHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        errors: ["Credenciais inválidas"]
      });
    }

    // Gerar tokens JWT
    const accessToken = jwt.sign(
      { id: admin.AdminID, email: admin.Email, role: 'admin' },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { id: admin.AdminID, email: admin.Email, role: 'admin' },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      admin: {
        id: admin.AdminID,
        nome: admin.Nome,
        email: admin.Email,
        cargo: admin.Cargo
      }
    });

  } catch (error) {
    logControllerError('login', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

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

    // Sanitize and validate query parameters
    const sanitizedSearch = DOMPurifyServer.sanitize(search?.toString() || '').trim();
    const sanitizedStatus = DOMPurifyServer.sanitize(status?.toString() || 'all').trim();

    // Validate pagination parameters
    const pageNum = parseInt(pagina);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      return res.status(400).json({
        success: false,
        errors: ["Página inválida"]
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        errors: ["Limite inválido"]
      });
    }

    // Validate status parameter
    if (!['all', 'ativo', 'inativo'].includes(sanitizedStatus)) {
      return res.status(400).json({
        success: false,
        errors: ["Status inválido"]
      });
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    const skip = (pageNum - 1) * limitNum;
    const whereClause = {
      ...(sanitizedStatus !== 'all' && { Ativo: sanitizedStatus === 'ativo' }),
      ...(sanitizedSearch && sanitizedSearch.length > 0 && sanitizedSearch.length <= 100 && {
        OR: [
          { Nome: { contains: sanitizedSearch, mode: 'insensitive' } },
          { Email: { contains: sanitizedSearch, mode: 'insensitive' } }
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
      pagina: pageNum,
      limit: limitNum
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
        take: limitNum
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

    // Sanitize and validate parameters
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();
    const sanitizedAtivo = typeof ativo === 'boolean' ? ativo : Boolean(ativo);

    // Validate ID
    const empresaId = parseInt(sanitizedId);
    if (isNaN(empresaId) || empresaId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID da empresa inválido"]
      });
    }

    const empresa = await prisma.empresa.update({
      where: { EmpresaID: empresaId },
      data: { Ativo: sanitizedAtivo }
    });

    // Log da ação administrativa
    logger.info('empresa_status_atualizado_admin', {
      adminId: user.id,
      empresaId: empresaId,
      novoStatus: sanitizedAtivo
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

    // Sanitize and validate query parameters
    const sanitizedSearch = DOMPurifyServer.sanitize(search?.toString() || '').trim();

    // Validate pagination parameters
    const pageNum = parseInt(pagina);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      return res.status(400).json({
        success: false,
        errors: ["Página inválida"]
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        errors: ["Limite inválido"]
      });
    }

    const skip = (pageNum - 1) * limitNum;
    const whereClause = sanitizedSearch && sanitizedSearch.length > 0 && sanitizedSearch.length <= 100 ? {
      OR: [
        { NomeCompleto: { contains: sanitizedSearch, mode: 'insensitive' } },
        { Email: { contains: sanitizedSearch, mode: 'insensitive' } },
        { CPF_CNPJ: { contains: sanitizedSearch } }
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
        take: limitNum
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
      pagina: pageNum,
      limit: limitNum
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

    // Sanitize and validate ID parameter
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();
    const clienteId = parseInt(sanitizedId);

    if (isNaN(clienteId) || clienteId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID do cliente inválido"]
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: clienteId },
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

    // Sanitize and validate periodo parameter
    const sanitizedPeriodo = DOMPurifyServer.sanitize(periodo?.toString() || '30d').trim();

    // Validate periodo parameter
    const allowedPeriodos = ['7d', '30d', '90d', '1y'];
    if (!allowedPeriodos.includes(sanitizedPeriodo)) {
      return res.status(400).json({
        success: false,
        errors: ["Período inválido"]
      });
    }

    // Calcular período
    const now = new Date();
    let startDate;
    switch (sanitizedPeriodo) {
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

// Responder mensagem de suporte
export const responderMensagemSuporte = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { resposta } = req.body;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    if (!resposta || resposta.trim() === '') {
      return res.status(400).json({
        success: false,
        errors: ["Resposta é obrigatória"]
      });
    }

    // Sanitize and validate parameters
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();
    const sanitizedResposta = DOMPurifyServer.sanitize(resposta?.toString() || '').trim();

    // Validate ID
    const mensagemId = parseInt(sanitizedId);
    if (isNaN(mensagemId) || mensagemId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID da mensagem inválido"]
      });
    }

    // Buscar mensagem
    const mensagem = await prisma.mensagemSuporte.findUnique({
      where: { MensagemID: mensagemId },
      include: { cliente: true }
    });

    if (!mensagem) {
      return res.status(404).json({
        success: false,
        errors: ["Mensagem não encontrada"]
      });
    }

    // Atualizar mensagem com resposta
    await prisma.mensagemSuporte.update({
      where: { MensagemID: mensagemId },
      data: {
        Resposta: sanitizedResposta,
        RespondidoPor: null, // Temporariamente null até resolver foreign key
        RespondidoEm: new Date(),
        Status: 'RESPONDIDO'
      }
    });

    // Criar notificação para o cliente
    await prisma.notificacao.create({
      data: {
        Titulo: 'Resposta do Suporte',
        Mensagem: `Sua mensagem sobre "${mensagem.Assunto}" foi respondida. Verifique sua caixa de entrada.`,
        Tipo: 'info',
        ClienteID: mensagem.ClienteID
      }
    });

    logger.info('mensagem_suporte_respondida', {
      adminId: user.id,
      mensagemId: mensagemId,
      clienteId: mensagem.ClienteID
    });

    res.json({
      success: true,
      message: 'Mensagem respondida com sucesso'
    });

  } catch (error) {
    logControllerError('responder_mensagem_suporte', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Resolver mensagem de suporte
export const resolverMensagemSuporte = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    // Sanitize and validate parameters
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();

    // Validate ID
    const mensagemId = parseInt(sanitizedId);
    if (isNaN(mensagemId) || mensagemId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID da mensagem inválido"]
      });
    }

    // Buscar mensagem
    const mensagem = await prisma.mensagemSuporte.findUnique({
      where: { MensagemID: mensagemId }
    });

    if (!mensagem) {
      return res.status(404).json({
        success: false,
        errors: ["Mensagem não encontrada"]
      });
    }

    // Atualizar status para resolvido
    await prisma.mensagemSuporte.update({
      where: { MensagemID: mensagemId },
      data: {
        Status: 'RESOLVIDO'
      }
    });

    logger.info('mensagem_suporte_resolvida', {
      adminId: user.id,
      mensagemId: mensagemId
    });

    res.json({
      success: true,
      message: 'Mensagem marcada como resolvida'
    });

  } catch (error) {
    logControllerError('resolver_mensagem_suporte', error, req);
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

    // Buscar avaliações de produtos E avaliações da plataforma (sistema)
    const [avaliacoesProdutos, totalProdutos, avaliacoesSistema, totalSistema] = await Promise.all([
      // Avaliações de produtos
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
      prisma.avaliacao.count(),

      // Avaliações da plataforma (sistema)
      prisma.avaliacaoPlataforma.findMany({
        select: {
          AvaliacaoID: true,
          Nota: true,
          Comentario: true,
          ExibirSite: true,
          CriadoEm: true,
          cliente: {
            select: {
              NomeCompleto: true,
              Email: true
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.avaliacaoPlataforma.count()
    ]);

    // Combinar as avaliações
    const todasAvaliacoes = [
      ...avaliacoesSistema.map(av => ({
        id: av.AvaliacaoID,
        tipo: 'plataforma',
        nome: av.cliente?.NomeCompleto || 'Anônimo',
        email: av.cliente?.Email || '',
        nota: av.Nota,
        comentario: av.Comentario,
        aprovado: av.ExibirSite,
        exibirLanding: av.ExibirSite,
        criadoEm: av.CriadoEm,
        produto: null
      })),
      ...avaliacoesProdutos.map(av => ({
        id: av.AvaliacaoID,
        tipo: 'produto',
        nome: av.cliente.NomeCompleto,
        email: av.cliente.Email,
        nota: av.Nota,
        comentario: av.Comentario,
        aprovado: true, // Avaliações de produto são sempre aprovadas
        exibirLanding: false,
        criadoEm: av.CriadoEm,
        produto: av.produto?.Nome
      }))
    ].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    // Paginação da lista combinada
    const total = totalProdutos + totalSistema;
    const paginatedAvaliacoes = todasAvaliacoes.slice(0, parseInt(limit)); // Remover skip para mostrar as mais recentes primeiro

    res.json({
      success: true,
      avaliacoes: paginatedAvaliacoes,
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
    const { visivel, tipo } = req.body;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    // Sanitize and validate parameters
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();
    const sanitizedVisivel = typeof visivel === 'boolean' ? visivel : Boolean(visivel);
    const sanitizedTipo = DOMPurifyServer.sanitize(tipo?.toString() || '').trim();

    // Validate ID
    const avaliacaoId = parseInt(sanitizedId);
    if (isNaN(avaliacaoId) || avaliacaoId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID da avaliação inválido"]
      });
    }

    if (sanitizedTipo === 'plataforma') {
      // Atualizar avaliação da plataforma
      await prisma.avaliacaoPlataforma.update({
        where: { AvaliacaoID: avaliacaoId },
        data: {
          ExibirSite: sanitizedVisivel
        }
      });
    } else {
      // Para avaliações de produto, não há campo de visibilidade
      // Apenas logamos a ação
      logger.info('avaliacao_produto_visibilidade_solicitada', {
        adminId: user.id,
        avaliacaoId: avaliacaoId,
        visivel: sanitizedVisivel
      });
    }

    logger.info('avaliacao_visibilidade_atualizada', {
      adminId: user.id,
      avaliacaoId: avaliacaoId,
      tipo: sanitizedTipo,
      visivel: sanitizedVisivel
    });

    res.json({
      success: true,
      message: `Avaliação ${sanitizedVisivel ? 'aprovada' : 'ocultada'} com sucesso`
    });

  } catch (error) {
    logControllerError('atualizar_visibilidade_avaliacao', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Deletar avaliação
export const deletarAvaliacao = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { tipo } = req.query;

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado."]
      });
    }

    // Sanitize and validate parameters
    const sanitizedId = DOMPurifyServer.sanitize(id?.toString() || '').trim();
    const sanitizedTipo = DOMPurifyServer.sanitize(tipo?.toString() || '').trim();

    // Validate ID
    const avaliacaoId = parseInt(sanitizedId);
    if (isNaN(avaliacaoId) || avaliacaoId < 1) {
      return res.status(400).json({
        success: false,
        errors: ["ID da avaliação inválido"]
      });
    }

    if (sanitizedTipo === 'plataforma') {
      // Deletar avaliação da plataforma
      await prisma.avaliacaoPlataforma.delete({
        where: { AvaliacaoID: avaliacaoId }
      });
    } else {
      // Deletar avaliação de produto
      await prisma.avaliacao.delete({
        where: { AvaliacaoID: avaliacaoId }
      });
    }

    logger.info('avaliacao_deletada', {
      adminId: user.id,
      avaliacaoId: avaliacaoId,
      tipo: sanitizedTipo
    });

    res.json({
      success: true,
      message: 'Avaliação deletada com sucesso'
    });

  } catch (error) {
    logControllerError('deletar_avaliacao', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};
