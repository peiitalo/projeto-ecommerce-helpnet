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

// Buscar perfil do vendedor atual
export const buscarPerfilVendedor = async (req, res) => {
  try {
    const { user } = req;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    const vendedor = await prisma.vendedor.findUnique({
      where: {
        VendedorID: user.vendedorId
      },
      include: {
        empresa: {
          select: {
            Nome: true,
            Documento: true,
            Telefone: true,
            Email: true
          }
        },
        _count: {
          select: {
            produtos: true,
            clientesVendedor: true
          }
        }
      }
    });

    // Buscar informações do cliente associado ao vendedor
    const cliente = await prisma.cliente.findUnique({
      where: {
        Email: vendedor.Email
      },
      select: {
        CPF_CNPJ: true,
        TelefoneFixo: true,
        TelefoneCelular: true,
        Whatsapp: true,
        RazaoSocial: true,
        InscricaoEstadual: true,
        InscricaoMunicipal: true,
        enderecos: {
          select: {
            EnderecoID: true,
            Nome: true,
            CEP: true,
            Cidade: true,
            UF: true,
            Numero: true,
            Bairro: true,
            Complemento: true
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

    // Calcular estatísticas
    const clientesComPedidos = await prisma.clienteVendedor.findMany({
      where: {
        VendedorID: user.vendedorId
      },
      include: {
        cliente: {
          include: {
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
    });

    const totalPedidos = clientesComPedidos.reduce((acc, cv) => {
      return acc + cv.cliente.pedidos.length;
    }, 0);

    const totalVendas = clientesComPedidos.reduce((acc, cv) => {
      return acc + cv.cliente.pedidos.reduce((pedidoAcc, pedido) => pedidoAcc + pedido.Total, 0);
    }, 0);

    res.json({
      success: true,
      vendedor: {
        VendedorID: vendedor.VendedorID,
        Nome: vendedor.Nome,
        Email: vendedor.Email,
        CriadoEm: vendedor.CriadoEm,
        Ativo: vendedor.Ativo,
        empresa: vendedor.empresa,
        cliente: cliente ? {
          CPF_CNPJ: cliente.CPF_CNPJ,
          TelefoneFixo: cliente.TelefoneFixo,
          TelefoneCelular: cliente.TelefoneCelular,
          Whatsapp: cliente.Whatsapp,
          RazaoSocial: cliente.RazaoSocial,
          InscricaoEstadual: cliente.InscricaoEstadual,
          InscricaoMunicipal: cliente.InscricaoMunicipal,
          Banco: cliente.Banco,
          Agencia: cliente.Agencia,
          ContaCorrente: cliente.ContaCorrente,
          TipoConta: cliente.TipoConta,
          enderecos: cliente.enderecos
        } : null,
        estatisticas: {
          totalProdutos: vendedor._count.produtos,
          totalClientes: vendedor._count.clientesVendedor,
          totalPedidos,
          totalVendas
        }
      }
    });

  } catch (error) {
    logControllerError('buscar_perfil_vendedor', error, req);
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

// Atualizar perfil do vendedor atual
export const atualizarPerfilVendedor = async (req, res) => {
  try {
    const { user } = req;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    const {
      NomeCompleto,
      Email,
      TelefoneCelular,
      TelefoneFixo,
      Whatsapp,
      RazaoSocial,
      InscricaoEstadual,
      InscricaoMunicipal,
      Banco,
      Agencia,
      ContaCorrente,
      TipoConta
    } = req.body;

    // Validações básicas
    if (!NomeCompleto || !Email) {
      return res.status(400).json({
        success: false,
        errors: ["Nome completo e e-mail são obrigatórios"]
      });
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        success: false,
        errors: ["E-mail inválido"]
      });
    }

    // Validação de dados bancários se fornecidos
    if (Banco || Agencia || ContaCorrente) {
      if (!Banco || !Agencia || !ContaCorrente) {
        return res.status(400).json({
          success: false,
          errors: ["Para dados bancários, banco, agência e conta corrente são obrigatórios"]
        });
      }

      if (TipoConta && !['corrente', 'poupanca'].includes(TipoConta)) {
        return res.status(400).json({
          success: false,
          errors: ["Tipo de conta deve ser 'corrente' ou 'poupanca'"]
        });
      }
    }

    // Verificar se e-mail já existe (se foi alterado)
    const vendedorAtual = await prisma.vendedor.findUnique({
      where: { VendedorID: user.vendedorId }
    });

    if (!vendedorAtual) {
      return res.status(404).json({
        success: false,
        errors: ["Vendedor não encontrado"]
      });
    }

    if (Email !== vendedorAtual.Email) {
      const emailExistente = await prisma.vendedor.findUnique({
        where: { Email: Email }
      });

      if (emailExistente) {
        return res.status(400).json({
          success: false,
          errors: ["E-mail já cadastrado"]
        });
      }
    }

    // Buscar cliente associado ao vendedor
    const cliente = await prisma.cliente.findUnique({
      where: { Email: vendedorAtual.Email }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        errors: ["Dados do cliente não encontrados"]
      });
    }

    // Atualizar vendedor
    const vendedorAtualizado = await prisma.vendedor.update({
      where: { VendedorID: user.vendedorId },
      data: {
        Nome: NomeCompleto,
        Email: Email
      }
    });

    // Atualizar cliente
    const clienteAtualizado = await prisma.cliente.update({
      where: { ClienteID: cliente.ClienteID },
      data: {
        NomeCompleto: NomeCompleto,
        Email: Email,
        TelefoneCelular: TelefoneCelular || null,
        TelefoneFixo: TelefoneFixo || null,
        Whatsapp: Whatsapp || null,
        RazaoSocial: RazaoSocial || null,
        InscricaoEstadual: InscricaoEstadual || null,
        InscricaoMunicipal: InscricaoMunicipal || null,
        Banco: Banco || null,
        Agencia: Agencia || null,
        ContaCorrente: ContaCorrente || null,
        TipoConta: TipoConta || null
      }
    });

    logger.info('perfil_vendedor_atualizado', {
      vendedorId: user.vendedorId,
      clienteId: cliente.ClienteID
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      vendedor: {
        VendedorID: vendedorAtualizado.VendedorID,
        Nome: vendedorAtualizado.Nome,
        Email: vendedorAtualizado.Email
      },
      cliente: {
        NomeCompleto: clienteAtualizado.NomeCompleto,
        Email: clienteAtualizado.Email,
        TelefoneCelular: clienteAtualizado.TelefoneCelular,
        TelefoneFixo: clienteAtualizado.TelefoneFixo,
        Whatsapp: clienteAtualizado.Whatsapp,
        RazaoSocial: clienteAtualizado.RazaoSocial,
        InscricaoEstadual: clienteAtualizado.InscricaoEstadual,
        InscricaoMunicipal: clienteAtualizado.InscricaoMunicipal,
        Banco: clienteAtualizado.Banco,
        Agencia: clienteAtualizado.Agencia,
        ContaCorrente: clienteAtualizado.ContaCorrente,
        TipoConta: clienteAtualizado.TipoConta
      }
    });

  } catch (error) {
    logControllerError('atualizar_perfil_vendedor', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};