import prisma from '../config/prisma.js';

// Função auxiliar para distribuir cupons PUBLICOS de forma assíncrona
const distribuirCupomPublicoAsync = async (cupomID, dataExpiracao) => {
  try {
    console.log(`Iniciando distribuição assíncrona do cupom ${cupomID}...`);

    // Buscar TODOS os clientes ativos pessoa física
    const todosClientes = await prisma.cliente.findMany({
      where: {
        TipoPessoa: 'FISICA' // Apenas pessoa física
      },
      select: { ClienteID: true }
    });

    console.log(`Encontrados ${todosClientes.length} clientes pessoa física ativos para distribuição`);

    if (todosClientes.length === 0) {
      console.log('Nenhum cliente pessoa física ativo encontrado para distribuição');
      return;
    }

    // Dividir em lotes de 100 para evitar sobrecarga
    const loteSize = 100;
    const lotes = [];
    for (let i = 0; i < todosClientes.length; i += loteSize) {
      lotes.push(todosClientes.slice(i, i + loteSize));
    }

    console.log(`Distribuindo em ${lotes.length} lotes...`);

    // Processar cada lote
    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      console.log(`Processando lote ${i + 1}/${lotes.length} com ${lote.length} clientes...`);

      try {
        const cuponsClienteParaCriar = lote.map(cliente => ({
          CupomID: cupomID,
          ClienteID: cliente.ClienteID,
          DisponivelParaResgate: true,
          DataExpiracaoCliente: dataExpiracao ? new Date(dataExpiracao) : null
        }));

        await prisma.cupomCliente.createMany({
          data: cuponsClienteParaCriar,
          skipDuplicates: true
        });

        // Criar notificações para os clientes do lote
        const notificacoesParaCriar = lote.map(cliente => ({
          Titulo: 'Novo Cupom Disponível!',
          Mensagem: `Você recebeu um novo cupom público. Confira seus cupons disponíveis!`,
          Tipo: 'success',
          ClienteID: cliente.ClienteID
        }));

        await prisma.notificacao.createMany({
          data: notificacoesParaCriar,
          skipDuplicates: true
        });

        // Pequena pausa entre lotes para não sobrecarregar
        if (i < lotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Erro ao processar lote ${i + 1}:`, error.message);
        // Continua com o próximo lote
      }
    }

    console.log(`Distribuição assíncrona do cupom ${cupomID} concluída com sucesso`);

  } catch (error) {
    console.error('Erro geral na distribuição assíncrona do cupom:', error);
  }
};

// Função auxiliar para distribuir cupons VENDEDOR_ESPECIFICO de forma assíncrona
const distribuirCupomVendedorAsync = async (cupomID, vendedorID, dataExpiracao) => {
  try {
    console.log(`Iniciando distribuição assíncrona do cupom ${cupomID} para clientes do vendedor ${vendedorID}...`);

    // Buscar clientes pessoa física que já fizeram pedidos deste vendedor
    const pedidosVendedor = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              VendedorID: vendedorID
            }
          }
        },
        cliente: {
          TipoPessoa: 'FISICA' // Apenas pessoa física
        }
      },
      select: { ClienteID: true },
      distinct: ['ClienteID']
    });

    console.log(`Encontrados ${pedidosVendedor.length} clientes pessoa física que já compraram do vendedor para distribuição`);

    if (pedidosVendedor.length === 0) {
      console.log('Nenhum cliente pessoa física com pedidos encontrado para este vendedor');
      return;
    }

    // Criar entradas na tabela CupomCliente
    const cuponsClienteParaCriar = pedidosVendedor.map(pedido => ({
      CupomID: cupomID,
      ClienteID: pedido.ClienteID,
      DisponivelParaResgate: true,
      DataExpiracaoCliente: dataExpiracao ? new Date(dataExpiracao) : null
    }));

    await prisma.cupomCliente.createMany({
      data: cuponsClienteParaCriar,
      skipDuplicates: true
    });

    // Criar notificações para os clientes do vendedor
    const notificacoesParaCriar = pedidosVendedor.map(pedido => ({
      Titulo: 'Novo Cupom Disponível!',
      Mensagem: `Você recebeu um novo cupom exclusivo do seu vendedor. Confira seus cupons disponíveis!`,
      Tipo: 'success',
      ClienteID: pedido.ClienteID
    }));

    await prisma.notificacao.createMany({
      data: notificacoesParaCriar,
      skipDuplicates: true
    });

    console.log(`Distribuição assíncrona do cupom ${cupomID} para vendedor concluída com sucesso`);

  } catch (error) {
    console.error('Erro geral na distribuição assíncrona do cupom para vendedor:', error);
  }
};


// Criar cupom
const criarCupom = async (req, res) => {
  try {
    console.log('Iniciando criação de cupom:', req.body);

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
      limiteUsoPorCliente,
      tipoDistribuicao
    } = req.body;

    const vendedorID = req.vendorId;
    console.log('VendedorID:', vendedorID);

    // Validar campos obrigatórios
    if (!codigo || !tipoDistribuicao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: codigo, tipoDistribuicao'
      });
    }

    // Validar tipoDistribuicao
    if (!['PUBLICO', 'VENDEDOR_ESPECIFICO'].includes(tipoDistribuicao)) {
      return res.status(400).json({
        success: false,
        message: 'tipoDistribuicao deve ser "PUBLICO" ou "VENDEDOR_ESPECIFICO"'
      });
    }

    const cupom = await prisma.cupom.create({
      data: {
        Codigo: codigo.toUpperCase(),
        Descricao: descricao,
        TipoDesconto: tipoDesconto || 'PERCENTUAL',
        ValorDesconto: parseFloat(valorDesconto) || 0,
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
        LimiteUsoPorCliente: limiteUsoPorCliente ? parseInt(limiteUsoPorCliente) : 1,
        TipoDistribuicao: tipoDistribuicao || 'PUBLICO',
        Ativo: true
      }
    });

    console.log('Cupom criado com sucesso:', cupom.CupomID);

    // Distribuir cupons de forma assíncrona - SEM await para não bloquear resposta
    try {
      if (tipoDistribuicao === 'PUBLICO') {
        console.log('Iniciando distribuição pública para pessoas físicas...');
        distribuirCupomPublicoAsync(cupom.CupomID, dataExpiracao);
      } else if (tipoDistribuicao === 'VENDEDOR_ESPECIFICO') {
        console.log('Iniciando distribuição específica do vendedor para pessoas físicas...');
        distribuirCupomVendedorAsync(cupom.CupomID, vendedorID, dataExpiracao);
      }
    } catch (distError) {
      console.error('Erro ao iniciar distribuição:', distError);
      // Não falhar a criação do cupom por causa da distribuição
    }

    // Agendar expiração automática se dataExpiracao foi definida
    if (dataExpiracao) {
      const expiracaoDate = new Date(dataExpiracao);
      const now = new Date();

      if (expiracaoDate > now) {
        // Calcular delay em milissegundos
        const delay = expiracaoDate.getTime() - now.getTime();

        setTimeout(async () => {
          try {
            console.log(`Expirando cupom ${cupom.CupomID} automaticamente...`);

            // Desativar cupom
            await prisma.cupom.update({
              where: { CupomID: cupom.CupomID },
              data: { Ativo: false }
            });

            // Remover distribuições dos clientes
            await prisma.cupomCliente.deleteMany({
              where: { CupomID: cupom.CupomID }
            });

            console.log(`Cupom ${cupom.CupomID} expirado automaticamente`);
          } catch (error) {
            console.error('Erro ao expirar cupom automaticamente:', error);
          }
        }, delay);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      data: cupom
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    console.error('Stack trace:', error.stack);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom já existe'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
};

// Listar cupons do vendedor
const listarCupons = async (req, res) => {
  try {
    const vendedorID = req.vendorId;
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
    const vendedorID = req.vendorId;

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        CriadoPor: vendedorID
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
    const vendedorID = req.vendorId;
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
      limiteUsoPorCliente,
      tipoDistribuicao
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

    // Preparar dados para atualização - usar valores existentes se não fornecidos
    const updateData = {};

    // Só atualizar campos que foram fornecidos
    if (ativo !== undefined) updateData.Ativo = ativo;
    if (descricao !== undefined) updateData.Descricao = descricao;
    if (tipoDesconto !== undefined) updateData.TipoDesconto = tipoDesconto;
    if (valorDesconto !== undefined) updateData.ValorDesconto = parseFloat(valorDesconto);
    if (valorMinimo !== undefined) updateData.ValorMinimo = parseFloat(valorMinimo) || 0;
    if (dataExpiracao !== undefined) updateData.DataExpiracao = dataExpiracao ? new Date(dataExpiracao) : null;
    if (aplicavelProdutos !== undefined) updateData.AplicavelProdutos = aplicavelProdutos;
    if (aplicavelCategorias !== undefined) updateData.AplicavelCategorias = aplicavelCategorias;
    if (tipoCliente !== undefined) updateData.TipoCliente = tipoCliente;
    if (produtosElegiveis !== undefined) updateData.ProdutosElegiveis = produtosElegiveis;
    if (categoriasElegiveis !== undefined) updateData.CategoriasElegiveis = categoriasElegiveis;
    if (limiteUsoPorCliente !== undefined) updateData.LimiteUsoPorCliente = parseInt(limiteUsoPorCliente) || 1;
    if (limiteUso !== undefined) updateData.LimiteUso = parseInt(limiteUso) || null;

    // Lidar com mudanças de tipo de distribuição
    const tipoDistribuicaoFinal = tipoDistribuicao || cupom.TipoDistribuicao;
    const tipoMudou = tipoDistribuicao && tipoDistribuicao !== cupom.TipoDistribuicao;

    if (tipoDistribuicao !== undefined) {
      updateData.TipoDistribuicao = tipoDistribuicaoFinal;
    }

    // Para cupons PUBLICOS, manter ClientesElegiveis vazio (distribuição automática)
    if (tipoDistribuicaoFinal === 'PUBLICO') {
      updateData.ClientesElegiveis = [];
    } else if (tipoDistribuicaoFinal === 'VENDEDOR_ESPECIFICO') {
      // Para cupons VENDEDOR_ESPECIFICO, manter ClientesElegiveis vazio (distribuição automática)
      updateData.ClientesElegiveis = [];
    } else {
      // Para outros tipos, usar valores fornecidos se especificados
      if (clientesElegiveis !== undefined) {
        updateData.ClientesElegiveis = clientesElegiveis;
      }
    }

    const cupomAtualizado = await prisma.cupom.update({
      where: { CupomID: parseInt(id) },
      data: updateData
    });

    // Se o cupom foi desativado, remover das distribuições dos clientes
    if (ativo === false) {
      await prisma.cupomCliente.deleteMany({
        where: { CupomID: parseInt(id) }
      });
    }

    res.json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      data: cupomAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
};

// Deletar cupom
const deletarCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorID = req.vendorId;

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

    // Remover todas as distribuições do cupom antes de deletar
    await prisma.cupomCliente.deleteMany({
      where: { CupomID: parseInt(id) }
    });

    // Deletar o cupom
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


// Endpoint removido - agora cupons são distribuídos automaticamente
const listarCuponsPublicos = async (req, res) => {
  // Este endpoint não é mais necessário pois cupons são distribuídos automaticamente
  // Os clientes veem apenas os cupons que receberam via /meus
  res.json({
    success: true,
    data: [],
    message: 'Cupons são distribuídos automaticamente. Use /meus para ver seus cupons.'
  });
};

// Endpoint para listar cupons disponíveis no carrinho (compatibilidade)
const listarCuponsDisponiveis = async (req, res) => {
  try {
    const clienteID = req.user.id;

    // Verificar se o cliente é pessoa física
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: clienteID },
      select: { TipoPessoa: true }
    });

    if (!cliente || cliente.TipoPessoa !== 'FISICA') {
      return res.json({
        success: true,
        data: []
      });
    }

    // Buscar cupons recebidos que estão ativos e não expiraram
    const cuponsDisponiveis = await prisma.cupomCliente.findMany({
      where: {
        ClienteID: clienteID,
        cupom: {
          Ativo: true,
          OR: [
            { DataExpiracao: null },
            { DataExpiracao: { gt: new Date() } }
          ]
        }
      },
      include: {
        cupom: {
          include: {
            vendedor: {
              select: {
                Nome: true,
                EmpresaID: true,
                empresa: {
                  select: {
                    Nome: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { RecebidoEm: 'desc' }
    });

    // Formatar resposta para compatibilidade
    const cuponsFormatados = cuponsDisponiveis.map(cupomCliente => ({
      id: cupomCliente.CupomClienteID,
      codigo: cupomCliente.cupom.Codigo,
      nome: cupomCliente.cupom.Nome,
      tipo: cupomCliente.cupom.Tipo,
      descontoTipo: cupomCliente.cupom.DescontoTipo,
      descontoValor: cupomCliente.cupom.DescontoValor,
      dataExpiracao: cupomCliente.cupom.DataExpiracao,
      restricoes: cupomCliente.cupom.Restricoes || {},
      vendedor: {
        nome: cupomCliente.cupom.vendedor?.Nome || 'Vendedor',
        empresa: cupomCliente.cupom.vendedor?.empresa?.Nome || null
      },
      status: cupomCliente.Usado ? 'used' : (cupomCliente.Resgatado ? 'redeemed' : 'available'),
      usosCliente: cupomCliente.UsosCliente,
      usoPorCliente: cupomCliente.cupom.UsoPorCliente
    }));

    res.json({
      success: true,
      data: cuponsFormatados
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
        Resgatado: false
      },
      include: {
        cupom: true
      }
    });

    if (!cupomCliente) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado ou já resgatado'
      });
    }

    // Verificar se cupom ainda está ativo e não expirou
    if (!cupomCliente.cupom.Ativo) {
      return res.status(400).json({
        success: false,
        message: 'Cupom inativo'
      });
    }

    if (cupomCliente.cupom.DataExpiracao && new Date() > cupomCliente.cupom.DataExpiracao) {
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
    const { codigo, clienteID, produtos = [], subtotal, frete } = req.body;

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

    // Verificar se está dentro do período válido
    const now = new Date();
    if (cupom.DataInicio && now < cupom.DataInicio) {
      return res.status(400).json({
        success: false,
        message: 'Cupom ainda não está disponível'
      });
    }

    // Verificar expiração
    if (cupom.DataExpiracao && now > cupom.DataExpiracao) {
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

    // Verificar se o cliente é pessoa física
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: clienteID },
      select: { TipoPessoa: true }
    });

    if (!cliente || cliente.TipoPessoa !== 'FISICA') {
      return res.status(400).json({
        success: false,
        message: 'Cupons disponíveis apenas para pessoas físicas'
      });
    }

    // Verificar se cliente recebeu o cupom
    const cupomCliente = await prisma.cupomCliente.findUnique({
      where: {
        CupomID_ClienteID: {
          CupomID: cupom.CupomID,
          ClienteID: clienteID
        }
      }
    });

    if (!cupomCliente) {
      return res.status(400).json({
        success: false,
        message: 'Você não possui este cupom'
      });
    }

    // Verificar se já foi usado o limite por cliente
    if (cupomCliente.UsosCliente >= cupom.UsoPorCliente) {
      return res.status(400).json({
        success: false,
        message: 'Limite de uso por cliente atingido'
      });
    }

    // Aplicar restrições configuráveis
    const restricoes = cupom.Restricoes || {};

    // Verificar valor mínimo da compra
    if (restricoes.valor_minimo_compra && subtotal < restricoes.valor_minimo_compra) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para uso do cupom: R$ ${restricoes.valor_minimo_compra.toFixed(2)}`
      });
    }

    // Verificar frete grátis acima de valor
    if (restricoes.frete_gratis_acima && frete > 0 && subtotal >= restricoes.frete_gratis_acima) {
      // Frete grátis automático se subtotal >= valor configurado
    }

    // Verificar quantidade mínima de itens
    if (restricoes.quantidade_minima_itens && produtos.length < restricoes.quantidade_minima_itens) {
      return res.status(400).json({
        success: false,
        message: `Quantidade mínima de itens: ${restricoes.quantidade_minima_itens}`
      });
    }

    // Verificar categoria restrita
    if (restricoes.categoria_restrita) {
      const categoriasIds = produtos.map(p => p.CategoriaID);
      const temCategoriaElegivel = categoriasIds.includes(restricoes.categoria_restrita);

      if (!temCategoriaElegivel) {
        return res.status(400).json({
          success: false,
          message: 'Cupom não aplicável à categoria selecionada'
        });
      }
    }

    res.json({
      success: true,
      message: 'Cupom válido',
      data: {
        cupom,
        valido: true,
        restricoes: restricoes
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

    // Aplicar restrições
    const restricoes = cupom.Restricoes || {};

    // Verificar valor mínimo da compra
    if (restricoes.valor_minimo_compra && subtotal < restricoes.valor_minimo_compra) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para uso do cupom: R$ ${restricoes.valor_minimo_compra.toFixed(2)}`
      });
    }

    // Verificar frete grátis acima de valor
    if (restricoes.frete_gratis_acima && frete > 0 && subtotal >= restricoes.frete_gratis_acima) {
      freteGratis = true;
      desconto = frete;
    }

    // Calcular desconto baseado no tipo
    switch (cupom.DescontoTipo) {
      case 'valor_fixo':
        desconto = cupom.DescontoValor;
        break;

      case 'porcentagem':
        // Aplicar desconto apenas nos produtos elegíveis se houver restrição de categoria
        if (restricoes.categoria_restrita) {
          const produtosElegiveis = produtos.filter(p =>
            p.CategoriaID === restricoes.categoria_restrita
          );
          const subtotalProdutos = produtosElegiveis.reduce((sum, p) =>
            sum + (p.PrecoUnitario * p.Quantidade), 0
          );
          desconto = subtotalProdutos * (cupom.DescontoValor / 100);
        } else {
          desconto = subtotal * (cupom.DescontoValor / 100);
        }
        break;

      case 'frete_gratis':
        freteGratis = true;
        desconto = frete;
        break;
    }

    const totalComDesconto = subtotal + frete - desconto;

    res.json({
      success: true,
      data: {
        desconto: parseFloat(desconto.toFixed(2)),
        freteGratis,
        totalComDesconto: parseFloat(totalComDesconto.toFixed(2)),
        cupom,
        restricoes: restricoes
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

// Listar cupons do cliente (cupons recebidos via distribuição)
const listarMeusCupons = async (req, res) => {
  try {
    const clienteID = req.user.id;

    // Verificar se o cliente é pessoa física
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: clienteID },
      select: { TipoPessoa: true }
    });

    if (!cliente || cliente.TipoPessoa !== 'FISICA') {
      return res.json({
        success: true,
        data: []
      });
    }

    const cuponsCliente = await prisma.cupomCliente.findMany({
      where: { ClienteID: clienteID },
      include: {
        cupom: {
          include: {
            vendedor: {
              select: {
                Nome: true,
                EmpresaID: true,
                empresa: {
                  select: {
                    Nome: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { RecebidoEm: 'desc' }
    });

    const cuponsFormatados = cuponsCliente.map(cupomCliente => ({
      id: cupomCliente.CupomClienteID,
      code: cupomCliente.cupom.Codigo,
      discount: cupomCliente.cupom.DescontoValor,
      type: cupomCliente.cupom.DescontoTipo === 'porcentagem' ? 'percentage' :
            cupomCliente.cupom.DescontoTipo === 'frete_gratis' ? 'free_shipping' : 'fixed',
      description: cupomCliente.cupom.Nome,
      validUntil: cupomCliente.cupom.DataExpiracao,
      used: cupomCliente.Usado,
      status: cupomCliente.Usado ? 'used' : (cupomCliente.Resgatado ? 'redeemed' : 'available'),
      redeemedAt: cupomCliente.DataResgate,
      usedAt: cupomCliente.DataUso,
      minValue: cupomCliente.cupom.Restricoes?.valor_minimo_compra || 0,
      canRedeem: !cupomCliente.Resgatado && !cupomCliente.Usado,
      vendedor: {
        nome: cupomCliente.cupom.vendedor?.Nome || 'Vendedor',
        empresa: cupomCliente.cupom.vendedor?.empresa?.Nome || null
      },
      restricoes: cupomCliente.cupom.Restricoes || {}
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
  listarCuponsPublicos,
  listarCuponsDisponiveis,
  resgatarCupom,
  listarMeusCupons,
  validarCupom,
  calcularDesconto
};