import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Criar cupom
const criarCupom = async (req, res) => {
  try {
    const {
      codigo,
      descricao,
      tipoDesconto,
      valorDesconto,
      valorMinimo,
      limiteUso,
      dataExpiracao,
      aplicavelProdutos,
      aplicavelCategorias,
      clientesElegiveis,
      tipoCliente,
      produtosElegiveis,
      categoriasElegiveis,
      limiteUsoPorCliente
    } = req.body;

    const vendedorID = req.user.VendedorID;

    const cupom = await prisma.cupom.create({
      data: {
        Codigo: codigo.toUpperCase(),
        Descricao: descricao,
        TipoDesconto: tipoDesconto,
        ValorDesconto: parseFloat(valorDesconto),
        ValorMinimo: valorMinimo ? parseFloat(valorMinimo) : 0,
        LimiteUso: limiteUso ? parseInt(limiteUso) : null,
        DataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        VendedorID: vendedorID,
        AplicavelProdutos: aplicavelProdutos || false,
        AplicavelCategorias: aplicavelCategorias || false,
        ClientesElegiveis: clientesElegiveis || [],
        TipoCliente: tipoCliente,
        ProdutosElegiveis: produtosElegiveis || [],
        CategoriasElegiveis: categoriasElegiveis || [],
        LimiteUsoPorCliente: limiteUsoPorCliente ? parseInt(limiteUsoPorCliente) : 1
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      data: cupom
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom já existe'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar cupons do vendedor
const listarCupons = async (req, res) => {
  try {
    const vendedorID = req.user.VendedorID;
    const { page = 1, limit = 10, ativo } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      VendedorID: vendedorID
    };

    if (ativo !== undefined) {
      where.Ativo = ativo === 'true';
    }

    const [cupons, total] = await Promise.all([
      prisma.cupom.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { CriadoEm: 'desc' }
      }),
      prisma.cupom.count({ where })
    ]);

    res.json({
      success: true,
      data: cupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar cupom por ID
const buscarCupomPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorID = req.user.VendedorID;

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        VendedorID: vendedorID
      }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    res.json({
      success: true,
      data: cupom
    });
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar cupom
const atualizarCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorID = req.user.VendedorID;
    const {
      descricao,
      tipoDesconto,
      valorDesconto,
      valorMinimo,
      limiteUso,
      dataExpiracao,
      ativo,
      aplicavelProdutos,
      aplicavelCategorias,
      clientesElegiveis,
      tipoCliente,
      produtosElegiveis,
      categoriasElegiveis,
      limiteUsoPorCliente
    } = req.body;

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        VendedorID: vendedorID
      }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    const cupomAtualizado = await prisma.cupom.update({
      where: { CupomID: parseInt(id) },
      data: {
        Descricao: descricao,
        TipoDesconto: tipoDesconto,
        ValorDesconto: parseFloat(valorDesconto),
        ValorMinimo: valorMinimo ? parseFloat(valorMinimo) : 0,
        LimiteUso: limiteUso ? parseInt(limiteUso) : null,
        DataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        Ativo: ativo,
        AplicavelProdutos: aplicavelProdutos,
        AplicavelCategorias: aplicavelCategorias,
        ClientesElegiveis: clientesElegiveis,
        TipoCliente: tipoCliente,
        ProdutosElegiveis: produtosElegiveis,
        CategoriasElegiveis: categoriasElegiveis,
        LimiteUsoPorCliente: limiteUsoPorCliente ? parseInt(limiteUsoPorCliente) : 1
      }
    });

    res.json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      data: cupomAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar cupom
const deletarCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorID = req.user.VendedorID;

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        VendedorID: vendedorID
      }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    await prisma.cupom.delete({
      where: { CupomID: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cupom deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Distribuir cupom para clientes
const distribuirCupom = async (req, res) => {
  try {
    const { cupomID, clientesIDs, dataExpiracaoCliente } = req.body;
    const vendedorID = req.user.VendedorID;

    // Verificar se cupom pertence ao vendedor
    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(cupomID),
        VendedorID: vendedorID
      }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    // Distribuir cupom para os clientes selecionados
    const distribuicoes = [];
    for (const clienteID of clientesIDs) {
      const distribuicao = await prisma.cupomCliente.upsert({
        where: {
          CupomID_ClienteID: {
            CupomID: parseInt(cupomID),
            ClienteID: parseInt(clienteID)
          }
        },
        update: {
          DisponivelParaResgate: true,
          DataExpiracaoCliente: dataExpiracaoCliente ? new Date(dataExpiracaoCliente) : null
        },
        create: {
          CupomID: parseInt(cupomID),
          ClienteID: parseInt(clienteID),
          DisponivelParaResgate: true,
          DataExpiracaoCliente: dataExpiracaoCliente ? new Date(dataExpiracaoCliente) : null
        }
      });
      distribuicoes.push(distribuicao);

      // Criar notificação para o cliente
      await prisma.notificacao.create({
        data: {
          Titulo: 'Novo Cupom Disponível!',
          Mensagem: `Você recebeu um novo cupom: ${cupom.Codigo}. ${cupom.Descricao || ''}`,
          Tipo: 'success',
          ClienteID: parseInt(clienteID)
        }
      });
    }

    res.json({
      success: true,
      message: `Cupom distribuído para ${distribuicoes.length} clientes`,
      data: distribuicoes
    });
  } catch (error) {
    console.error('Erro ao distribuir cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar cupons disponíveis para resgate (cliente)
const listarCuponsDisponiveis = async (req, res) => {
  try {
    const clienteID = req.user.id;

    const cuponsDisponiveis = await prisma.cupomCliente.findMany({
      where: {
        ClienteID: clienteID,
        DisponivelParaResgate: true,
        Resgatado: false,
        OR: [
          { DataExpiracaoCliente: null },
          { DataExpiracaoCliente: { gt: new Date() } }
        ]
      },
      include: {
        cupom: true
      },
      orderBy: { cupom: { CriadoEm: 'desc' } }
    });

    res.json({
      success: true,
      data: cuponsDisponiveis
    });
  } catch (error) {
    console.error('Erro ao listar cupons disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Resgatar cupom (cliente)
const resgatarCupom = async (req, res) => {
  try {
    const { cupomClienteID } = req.body;
    const clienteID = req.user.id;

    // Buscar distribuição do cupom
    const cupomCliente = await prisma.cupomCliente.findFirst({
      where: {
        CupomClienteID: parseInt(cupomClienteID),
        ClienteID: clienteID,
        DisponivelParaResgate: true,
        Resgatado: false
      },
      include: {
        cupom: true
      }
    });

    if (!cupomCliente) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não disponível para resgate'
      });
    }

    // Verificar expiração
    if (cupomCliente.DataExpiracaoCliente && new Date() > cupomCliente.DataExpiracaoCliente) {
      return res.status(400).json({
        success: false,
        message: 'Cupom expirado'
      });
    }

    // Marcar como resgatado
    await prisma.cupomCliente.update({
      where: { CupomClienteID: parseInt(cupomClienteID) },
      data: {
        Resgatado: true,
        DataResgate: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Cupom resgatado com sucesso!',
      data: {
        cupom: cupomCliente.cupom,
        codigo: cupomCliente.cupom.Codigo
      }
    });
  } catch (error) {
    console.error('Erro ao resgatar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Validar cupom para uso (cliente)
const validarCupom = async (req, res) => {
  try {
    const { codigo, clienteID, produtos = [] } = req.body;

    const cupom = await prisma.cupom.findUnique({
      where: { Codigo: codigo.toUpperCase() }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    // Verificar se cupom está ativo
    if (!cupom.Ativo) {
      return res.status(400).json({
        success: false,
        message: 'Cupom inativo'
      });
    }

    // Verificar expiração
    if (cupom.DataExpiracao && new Date() > cupom.DataExpiracao) {
      return res.status(400).json({
        success: false,
        message: 'Cupom expirado'
      });
    }

    // Verificar limite de uso global
    if (cupom.LimiteUso && cupom.UsosAtuais >= cupom.LimiteUso) {
      return res.status(400).json({
        success: false,
        message: 'Limite de uso do cupom atingido'
      });
    }

    // Verificar se cliente resgatou o cupom
    const cupomCliente = await prisma.cupomCliente.findUnique({
      where: {
        CupomID_ClienteID: {
          CupomID: cupom.CupomID,
          ClienteID: clienteID
        }
      }
    });

    if (!cupomCliente || !cupomCliente.Resgatado) {
      return res.status(400).json({
        success: false,
        message: 'Você precisa resgatar este cupom antes de usá-lo'
      });
    }

    // Verificar uso por cliente
    if (cupomCliente.UsosCliente >= cupom.LimiteUsoPorCliente) {
      return res.status(400).json({
        success: false,
        message: 'Limite de uso por cliente atingido'
      });
    }

    // Verificar aplicabilidade a produtos/categorias
    if (cupom.AplicavelProdutos && cupom.ProdutosElegiveis.length > 0) {
      const produtosIds = produtos.map(p => p.ProdutoID);
      const temProdutoElegivel = produtosIds.some(id => cupom.ProdutosElegiveis.includes(id));

      if (!temProdutoElegivel) {
        return res.status(400).json({
          success: false,
          message: 'Cupom não aplicável aos produtos selecionados'
        });
      }
    }

    if (cupom.AplicavelCategorias && cupom.CategoriasElegiveis.length > 0) {
      const categoriasIds = produtos.map(p => p.CategoriaID);
      const temCategoriaElegivel = categoriasIds.some(id => cupom.CategoriasElegiveis.includes(id));

      if (!temCategoriaElegivel) {
        return res.status(400).json({
          success: false,
          message: 'Cupom não aplicável às categorias selecionadas'
        });
      }
    }

    res.json({
      success: true,
      message: 'Cupom válido',
      data: {
        cupom,
        valido: true
      }
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Calcular desconto
const calcularDesconto = async (req, res) => {
  try {
    const { codigo, subtotal, frete, produtos = [] } = req.body;

    const cupom = await prisma.cupom.findUnique({
      where: { Codigo: codigo.toUpperCase() }
    });

    if (!cupom) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    let desconto = 0;
    let freteGratis = false;

    // Verificar valor mínimo
    if (cupom.ValorMinimo > 0 && subtotal < cupom.ValorMinimo) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para uso do cupom: R$ ${cupom.ValorMinimo.toFixed(2)}`
      });
    }

    switch (cupom.TipoDesconto) {
      case 'VALOR_FIXO':
        desconto = cupom.ValorDesconto;
        break;

      case 'PERCENTUAL':
        // Calcular apenas nos produtos elegíveis se aplicável
        if (cupom.AplicavelProdutos && cupom.ProdutosElegiveis.length > 0) {
          const produtosElegiveis = produtos.filter(p =>
            cupom.ProdutosElegiveis.includes(p.ProdutoID)
          );
          const subtotalProdutos = produtosElegiveis.reduce((sum, p) =>
            sum + (p.PrecoUnitario * p.Quantidade), 0
          );
          desconto = subtotalProdutos * (cupom.ValorDesconto / 100);
        } else if (cupom.AplicavelCategorias && cupom.CategoriasElegiveis.length > 0) {
          const produtosElegiveis = produtos.filter(p =>
            cupom.CategoriasElegiveis.includes(p.CategoriaID)
          );
          const subtotalProdutos = produtosElegiveis.reduce((sum, p) =>
            sum + (p.PrecoUnitario * p.Quantidade), 0
          );
          desconto = subtotalProdutos * (cupom.ValorDesconto / 100);
        } else {
          desconto = subtotal * (cupom.ValorDesconto / 100);
        }
        break;

      case 'FRETE_GRATIS':
        freteGratis = true;
        desconto = frete; // Desconto no valor do frete
        break;
    }

    const totalComDesconto = subtotal + frete - desconto;

    res.json({
      success: true,
      data: {
        desconto: parseFloat(desconto.toFixed(2)),
        freteGratis,
        totalComDesconto: parseFloat(totalComDesconto.toFixed(2)),
        cupom
      }
    });
  } catch (error) {
    console.error('Erro ao calcular desconto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar cupons do cliente (resgatados e disponíveis)
const listarMeusCupons = async (req, res) => {
  try {
    const clienteID = req.user.id;

    const cuponsCliente = await prisma.cupomCliente.findMany({
      where: { ClienteID: clienteID },
      include: {
        cupom: true
      },
      orderBy: { CriadoEm: 'desc' }
    });

    const cuponsFormatados = cuponsCliente.map(cupomCliente => ({
      id: cupomCliente.CupomClienteID,
      code: cupomCliente.cupom.Codigo,
      discount: cupomCliente.cupom.ValorDesconto,
      type: cupomCliente.cupom.TipoDesconto === 'PERCENTUAL' ? 'percentage' :
            cupomCliente.cupom.TipoDesconto === 'FRETE_GRATIS' ? 'free_shipping' : 'fixed',
      description: cupomCliente.cupom.Descricao,
      validUntil: cupomCliente.DataExpiracaoCliente || cupomCliente.cupom.DataExpiracao,
      used: cupomCliente.Usado,
      status: cupomCliente.Usado ? 'used' : 'redeemed',
      redeemedAt: cupomCliente.DataResgate,
      usedAt: cupomCliente.DataUso,
      minValue: cupomCliente.cupom.ValorMinimo
    }));

    res.json({
      success: true,
      data: cuponsFormatados
    });
  } catch (error) {
    console.error('Erro ao listar meus cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export default {
  criarCupom,
  listarCupons,
  buscarCupomPorId,
  atualizarCupom,
  deletarCupom,
  distribuirCupom,
  listarCuponsDisponiveis,
  resgatarCupom,
  listarMeusCupons,
  validarCupom,
  calcularDesconto
};