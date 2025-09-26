// backend/src/controllers/vendedorController.js
import prisma from "../config/prisma.js";
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

const logControllerError = (operation, error, req) => {
  logger.error(`vendedor_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    userId: req?.user?.id,
    empresaId: req?.user?.empresaId,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Listar vendedores da empresa
export const listarVendedores = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, limit = 10, search = '' } = req.query;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Construir where clause
    const whereClause = {
      EmpresaID: user.empresaId,
      Ativo: true
    };

    // Adicionar filtro de busca se fornecido
    if (search.trim()) {
      whereClause.OR = [
        { Nome: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Buscar vendedores com paginação
    const [vendedores, total] = await prisma.$transaction([
      prisma.vendedor.findMany({
        where: whereClause,
        select: {
          VendedorID: true,
          Nome: true,
          Email: true,
          CriadoEm: true,
          Ativo: true,
          _count: {
            select: {
              produtos: true,
              clientesVendedor: true
            }
          },
          clientesVendedor: {
            select: {
              _count: {
                select: {
                  cliente: {
                    select: {
                      pedidos: {
                        where: {
                          Status: 'Entregue'
                        }
                      }
                    }
                  }
                }
              },
              cliente: {
                select: {
                  pedidos: {
                    where: {
                      Status: 'Entregue'
                    },
                    select: {
                      Total: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.vendedor.count({ where: whereClause })
    ]);

    // Calcular estatísticas para cada vendedor
    const vendedoresComStats = vendedores.map(vendedor => {
      const totalPedidos = vendedor.clientesVendedor.reduce((acc, cv) => {
        return acc + cv.cliente.pedidos.length;
      }, 0);

      const totalVendas = vendedor.clientesVendedor.reduce((acc, cv) => {
        return acc + cv.cliente.pedidos.reduce((pedidoAcc, pedido) => pedidoAcc + pedido.Total, 0);
      }, 0);

      return {
        id: vendedor.VendedorID.toString(),
        name: vendedor.Nome,
        email: vendedor.Email,
        joinDate: vendedor.CriadoEm.toISOString(),
        status: vendedor.Ativo ? 'active' : 'inactive',
        totalSales: totalVendas,
        totalOrders: totalPedidos
      };
    });

    res.json({
      success: true,
      vendedores: vendedoresComStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    logControllerError('listar_vendedores', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Buscar vendedor específico
export const buscarVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { vendedorId } = req.params;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    const vendedor = await prisma.vendedor.findFirst({
      where: {
        VendedorID: parseInt(vendedorId),
        EmpresaID: user.empresaId
      },
      select: {
        VendedorID: true,
        Nome: true,
        Email: true,
        CriadoEm: true,
        Ativo: true,
        _count: {
          select: {
            produtos: true,
            clientesVendedor: true
          }
        }
      }
    });

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        errors: ["Vendedor não encontrado"]
      });
    }

    res.json({
      success: true,
      vendedor: {
        id: vendedor.VendedorID.toString(),
        name: vendedor.Nome,
        email: vendedor.Email,
        joinDate: vendedor.CriadoEm.toISOString(),
        status: vendedor.Ativo ? 'active' : 'inactive',
        totalProducts: vendedor._count.produtos,
        totalClients: vendedor._count.clientesVendedor
      }
    });

  } catch (error) {
    logControllerError('buscar_vendedor', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Criar novo vendedor
export const criarVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { name, email, password } = req.body;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        errors: ["Nome, e-mail e senha são obrigatórios"]
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        errors: ["A senha deve ter pelo menos 8 caracteres"]
      });
    }

    // Verificar se e-mail já existe
    const vendedorExistente = await prisma.vendedor.findUnique({
      where: { Email: email }
    });

    if (vendedorExistente) {
      return res.status(400).json({
        success: false,
        errors: ["E-mail já cadastrado"]
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(password, saltRounds);

    // Criar vendedor
    const vendedor = await prisma.vendedor.create({
      data: {
        Nome: name,
        Email: email,
        SenhaHash: senhaHash,
        EmpresaID: user.empresaId
      },
      select: {
        VendedorID: true,
        Nome: true,
        Email: true,
        CriadoEm: true,
        Ativo: true
      }
    });

    logger.info('vendedor_criado', {
      vendedorId: vendedor.VendedorID,
      empresaId: user.empresaId
    });

    res.status(201).json({
      success: true,
      message: 'Vendedor criado com sucesso',
      vendedor: {
        id: vendedor.VendedorID.toString(),
        name: vendedor.Nome,
        email: vendedor.Email,
        joinDate: vendedor.CriadoEm.toISOString(),
        status: vendedor.Ativo ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    logControllerError('criar_vendedor', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Atualizar vendedor
export const atualizarVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { vendedorId } = req.params;
    const { name, email, status } = req.body;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Verificar se vendedor existe e pertence à empresa
    const vendedor = await prisma.vendedor.findFirst({
      where: {
        VendedorID: parseInt(vendedorId),
        EmpresaID: user.empresaId
      }
    });

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        errors: ["Vendedor não encontrado"]
      });
    }

    // Verificar se e-mail já existe (se foi alterado)
    if (email && email !== vendedor.Email) {
      const emailExistente = await prisma.vendedor.findUnique({
        where: { Email: email }
      });

      if (emailExistente) {
        return res.status(400).json({
          success: false,
          errors: ["E-mail já cadastrado"]
        });
      }
    }

    // Atualizar vendedor
    const dadosAtualizacao = {};
    if (name) dadosAtualizacao.Nome = name;
    if (email) dadosAtualizacao.Email = email;
    if (status !== undefined) dadosAtualizacao.Ativo = status === 'active';

    const vendedorAtualizado = await prisma.vendedor.update({
      where: { VendedorID: parseInt(vendedorId) },
      data: dadosAtualizacao,
      select: {
        VendedorID: true,
        Nome: true,
        Email: true,
        CriadoEm: true,
        Ativo: true
      }
    });

    logger.info('vendedor_atualizado', {
      vendedorId: vendedorAtualizado.VendedorID,
      empresaId: user.empresaId
    });

    res.json({
      success: true,
      message: 'Vendedor atualizado com sucesso',
      vendedor: {
        id: vendedorAtualizado.VendedorID.toString(),
        name: vendedorAtualizado.Nome,
        email: vendedorAtualizado.Email,
        joinDate: vendedorAtualizado.CriadoEm.toISOString(),
        status: vendedorAtualizado.Ativo ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    logControllerError('atualizar_vendedor', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Excluir vendedor (soft delete)
export const excluirVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { vendedorId } = req.params;

    if (!user?.empresaId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Empresa não identificada."]
      });
    }

    // Verificar se vendedor existe e pertence à empresa
    const vendedor = await prisma.vendedor.findFirst({
      where: {
        VendedorID: parseInt(vendedorId),
        EmpresaID: user.empresaId
      }
    });

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        errors: ["Vendedor não encontrado"]
      });
    }

    // Soft delete - desativar vendedor
    await prisma.vendedor.update({
      where: { VendedorID: parseInt(vendedorId) },
      data: { Ativo: false }
    });

    logger.info('vendedor_excluido', {
      vendedorId: parseInt(vendedorId),
      empresaId: user.empresaId
    });

    res.json({
      success: true,
      message: 'Vendedor excluído com sucesso'
    });

  } catch (error) {
    logControllerError('excluir_vendedor', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};