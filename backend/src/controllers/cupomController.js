// backend/src/controllers/cupomController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";

/**
 * Lista cupons do vendedor com filtros opcionais
 * @param {Object} req - Requisição Express
 * @param {Object} req.query - Query parameters: status, busca, pagina, limit
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupons e total
 */
export const listarCupons = async (req, res) => {
  try {
    const { status, busca, pagina = 1, limit = 10 } = req.query;
    const skip = (pagina - 1) * limit;
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    const where = {
      CriadoPor: vendedorId
    };

    if (status === "ativo") where.Ativo = true;
    else if (status === "inativo") where.Ativo = false;

    if (busca) {
      where.OR = [
        { Nome: { contains: busca, mode: "insensitive" } },
        { Codigo: { contains: busca, mode: "insensitive" } },
      ];
    }

    const [cupons, total] = await prisma.$transaction([
      prisma.cupom.findMany({
        where,
        select: {
          CupomID: true,
          Nome: true,
          Codigo: true,
          Tipo: true,
          DescontoTipo: true,
          DescontoValor: true,
          DataInicio: true,
          DataExpiracao: true,
          LimiteUso: true,
          UsoPorCliente: true,
          Ativo: true,
          UsosAtuais: true,
          CriadoEm: true,
          _count: {
            select: {
              cuponsCliente: true,
              pedidos: true
            }
          }
        },
        orderBy: { CriadoEm: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.cupom.count({ where }),
    ]);

    logger.info('listar_cupons_ok', { total, filtros: req.query });
    res.json({ cupons, total });
  } catch (error) {
    logControllerError('listar_cupons_error', error, req);
    res.status(500).json({ error: "Erro ao listar cupons" });
  }
};

/**
 * Busca cupom por ID
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com dados do cupom
 */
export const buscarCupomPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        CriadoPor: vendedorId
      },
      include: {
        cuponsCliente: {
          include: {
            cliente: {
              select: {
                ClienteID: true,
                NomeCompleto: true,
                Email: true
              }
            }
          }
        },
        pedidos: {
          select: {
            PedidoID: true,
            DataPedido: true,
            Total: true,
            cliente: {
              select: {
                NomeCompleto: true
              }
            }
          },
          take: 5
        }
      }
    });

    if (!cupom) {
      logger.warn('cupom_nao_encontrado', { id });
      return res.status(404).json({ error: "Cupom não encontrado" });
    }

    logger.info('buscar_cupom_ok', { id });
    res.json(cupom);
  } catch (error) {
    logControllerError('buscar_cupom_error', error, req);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Cria um novo cupom
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupom criado
 */
export const criarCupom = async (req, res) => {
  try {
    const {
      nome,
      codigo,
      tipo,
      descontoTipo,
      descontoValor,
      dataInicio,
      dataExpiracao,
      limiteUso,
      usoPorCliente,
      clientesEspecificos,
      restricoes
    } = req.body;

    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    if (!nome || !codigo || !descontoTipo || descontoValor === undefined) {
      return res.status(400).json({
        error: "Campos obrigatórios: nome, codigo, descontoTipo, descontoValor"
      });
    }

    // Validar código único
    const codigoExistente = await prisma.cupom.findUnique({
      where: { Codigo: codigo }
    });
    if (codigoExistente) {
      return res.status(400).json({ error: "Código do cupom já existe" });
    }

    // Validar tipo de desconto
    const tiposValidos = ['porcentagem', 'valor_fixo', 'frete_gratis'];
    if (!tiposValidos.includes(descontoTipo)) {
      return res.status(400).json({ error: "Tipo de desconto inválido" });
    }

    // Validar tipo de distribuição
    const tiposDistribuicao = ['publico', 'especifico'];
    const tipoCupom = tiposDistribuicao.includes(tipo) ? tipo : 'publico';

    // Se específico, validar clientes
    if (tipoCupom === 'especifico' && (!clientesEspecificos || !Array.isArray(clientesEspecificos))) {
      return res.status(400).json({ error: "Para cupons específicos, deve fornecer lista de clientes" });
    }

    // Preparar restrições
    const restricoesObj = {};
    if (restricoes?.categoriaId) restricoesObj.categoriaId = parseInt(restricoes.categoriaId);
    if (restricoes?.valorMinimo) restricoesObj.valorMinimo = parseFloat(restricoes.valorMinimo);

    const cupom = await prisma.cupom.create({
      data: {
        Nome: nome,
        Codigo: codigo,
        Tipo: tipoCupom,
        DescontoTipo: descontoTipo,
        DescontoValor: parseFloat(descontoValor),
        DataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        DataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        LimiteUso: limiteUso ? parseInt(limiteUso) : null,
        UsoPorCliente: usoPorCliente ? parseInt(usoPorCliente) : 1,
        Ativo: true,
        CriadoPor: vendedorId,
        Restricoes: Object.keys(restricoesObj).length > 0 ? restricoesObj : null
      }
    });

    // Se específico, criar relações com clientes
    if (tipoCupom === 'especifico' && clientesEspecificos.length > 0) {
      const cuponsCliente = clientesEspecificos.map(clienteId => ({
        CupomID: cupom.CupomID,
        ClienteID: parseInt(clienteId)
      }));

      await prisma.cupomCliente.createMany({
        data: cuponsCliente,
        skipDuplicates: true
      });
    }

    logger.info('criar_cupom_ok', { id: cupom.CupomID, codigo: cupom.Codigo });
    res.status(201).json(cupom);
  } catch (error) {
    logControllerError('criar_cupom_error', error, req);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Código do cupom já existe" });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Atualiza um cupom existente
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupom atualizado
 */
export const atualizarCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    const cupomExistente = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        CriadoPor: vendedorId
      }
    });

    if (!cupomExistente) {
      return res.status(404).json({ error: "Cupom não encontrado" });
    }

    // Validar código único se estiver sendo alterado
    if (data.codigo && data.codigo !== cupomExistente.Codigo) {
      const codigoExistente = await prisma.cupom.findUnique({
        where: { Codigo: data.codigo }
      });
      if (codigoExistente) {
        return res.status(400).json({ error: "Código do cupom já existe" });
      }
    }

    // Validar tipo de desconto se estiver sendo alterado
    if (data.descontoTipo) {
      const tiposValidos = ['porcentagem', 'valor_fixo', 'frete_gratis'];
      if (!tiposValidos.includes(data.descontoTipo)) {
        return res.status(400).json({ error: "Tipo de desconto inválido" });
      }
    }

    const cupom = await prisma.cupom.update({
      where: { CupomID: parseInt(id) },
      data: {
        ...(data.nome && { Nome: data.nome }),
        ...(data.codigo && { Codigo: data.codigo }),
        ...(data.tipo && { Tipo: data.tipo }),
        ...(data.descontoTipo && { DescontoTipo: data.descontoTipo }),
        ...(data.descontoValor !== undefined && { DescontoValor: parseFloat(data.descontoValor) }),
        ...(data.dataInicio && { DataInicio: new Date(data.dataInicio) }),
        ...(data.dataExpiracao !== undefined && {
          DataExpiracao: data.dataExpiracao ? new Date(data.dataExpiracao) : null
        }),
        ...(data.limiteUso !== undefined && {
          LimiteUso: data.limiteUso ? parseInt(data.limiteUso) : null
        }),
        ...(data.usoPorCliente !== undefined && {
          UsoPorCliente: data.usoPorCliente ? parseInt(data.usoPorCliente) : 1
        }),
        ...(data.ativo !== undefined && { Ativo: data.ativo }),
        ...(data.restricoes !== undefined && {
          Restricoes: data.restricoes && Object.keys(data.restricoes).length > 0 ? data.restricoes : null
        })
      }
    });

    // Se tipo mudou para específico, adicionar clientes
    if (data.tipo === 'especifico' && data.clientesEspecificos && Array.isArray(data.clientesEspecificos)) {
      // Primeiro, remover relações existentes
      await prisma.cupomCliente.deleteMany({
        where: { CupomID: parseInt(id) }
      });

      // Adicionar novas relações
      if (data.clientesEspecificos.length > 0) {
        const cuponsCliente = data.clientesEspecificos.map(clienteId => ({
          CupomID: parseInt(id),
          ClienteID: parseInt(clienteId)
        }));

        await prisma.cupomCliente.createMany({
          data: cuponsCliente,
          skipDuplicates: true
        });
      }
    }

    logger.info('atualizar_cupom_ok', { id: cupom.CupomID });
    res.json(cupom);
  } catch (error) {
    logControllerError('atualizar_cupom_error', error, req);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Código do cupom já existe" });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Exclui um cupom
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com mensagem de sucesso
 */
export const excluirCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        CriadoPor: vendedorId
      }
    });

    if (!cupom) {
      return res.status(404).json({ error: "Cupom não encontrado" });
    }

    // Verificar se o cupom já foi usado
    const temUso = await prisma.pedido.findFirst({
      where: { CupomID: parseInt(id) }
    });

    if (temUso) {
      return res.status(400).json({
        error: "Não é possível excluir cupom que já foi utilizado em pedidos"
      });
    }

    // Excluir relações primeiro
    await prisma.cupomCliente.deleteMany({
      where: { CupomID: parseInt(id) }
    });

    // Excluir cupom
    await prisma.cupom.delete({
      where: { CupomID: parseInt(id) }
    });

    logger.info('excluir_cupom_ok', { id });
    res.json({ message: "Cupom excluído com sucesso" });
  } catch (error) {
    logControllerError('excluir_cupom_error', error, req);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Ativa/desativa um cupom
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupom atualizado
 */
export const toggleCupomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    const cupom = await prisma.cupom.findFirst({
      where: {
        CupomID: parseInt(id),
        CriadoPor: vendedorId
      }
    });

    if (!cupom) {
      return res.status(404).json({ error: "Cupom não encontrado" });
    }

    const cupomAtualizado = await prisma.cupom.update({
      where: { CupomID: parseInt(id) },
      data: { Ativo: !cupom.Ativo }
    });

    logger.info('toggle_cupom_status_ok', { id, ativo: cupomAtualizado.Ativo });
    res.json(cupomAtualizado);
  } catch (error) {
    logControllerError('toggle_cupom_status_error', error, req);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Lista clientes do vendedor para seleção em cupons específicos
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com lista de clientes
 */
export const listarClientesParaCupom = async (req, res) => {
  try {
    const vendedorId = req.user?.vendedorId;

    if (!vendedorId) {
      return res.status(401).json({ error: "Vendedor não autenticado" });
    }

    // Buscar clientes que compraram do vendedor
    const clientes = await prisma.clienteVendedor.findMany({
      where: { VendedorID: vendedorId },
      include: {
        cliente: {
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true,
            DataCadastro: true
          }
        }
      },
      orderBy: { UltimoPedidoEm: 'desc' }
    });

    const clientesFormatados = clientes.map(cv => ({
      ClienteID: cv.cliente.ClienteID,
      NomeCompleto: cv.cliente.NomeCompleto,
      Email: cv.cliente.Email,
      DataCadastro: cv.cliente.DataCadastro,
      UltimoPedidoEm: cv.UltimoPedidoEm,
      TotalPedidos: cv.TotalPedidos,
      ValorTotal: cv.ValorTotal
    }));

    logger.info('listar_clientes_cupom_ok', { total: clientesFormatados.length });
    res.json({ clientes: clientesFormatados });
  } catch (error) {
    logControllerError('listar_clientes_cupom_error', error, req);
    res.status(500).json({ error: "Erro ao listar clientes" });
  }
};

/**
 * Lista cupons disponíveis para um cliente (públicos + atribuídos especificamente)
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupons disponíveis
 */
export const listarCuponsDisponiveisCliente = async (req, res) => {
  try {
    const clienteId = req.user?.id;

    if (!clienteId) {
      return res.status(401).json({ error: "Cliente não autenticado" });
    }

    // Buscar cupons públicos ativos + cupons específicos atribuídos ao cliente
    const cupons = await prisma.cupom.findMany({
      where: {
        Ativo: true,
        DataInicio: { lte: new Date() },
        OR: [
          {
            Tipo: 'publico',
            OR: [
              { DataExpiracao: { gte: new Date() } },
              { DataExpiracao: null }
            ]
          },
          {
            Tipo: 'especifico',
            cuponsCliente: {
              some: {
                ClienteID: clienteId,
                Resgatado: false
              }
            },
            OR: [
              { DataExpiracao: { gte: new Date() } },
              { DataExpiracao: null }
            ]
          }
        ]
      },
      select: {
        CupomID: true,
        Nome: true,
        Codigo: true,
        Tipo: true,
        DescontoTipo: true,
        DescontoValor: true,
        DataExpiracao: true,
        LimiteUso: true,
        UsoPorCliente: true,
        Restricoes: true,
        UsosAtuais: true,
        cuponsCliente: {
          where: { ClienteID: clienteId },
          select: {
            Resgatado: true,
            Usado: true,
            UsosCliente: true
          }
        }
      },
      orderBy: { RecebidoEm: 'desc' }
    });

    // Filtrar cupons que ainda podem ser usados pelo cliente
    const cuponsDisponiveis = cupons.filter(cupom => {
      // Verificar limite total de uso
      if (cupom.LimiteUso && cupom.UsosAtuais >= cupom.LimiteUso) {
        return false;
      }

      // Para cupons específicos, verificar uso individual
      if (cupom.Tipo === 'especifico' && cupom.cuponsCliente.length > 0) {
        const usoCliente = cupom.cuponsCliente[0];
        if (usoCliente.Usado || (cupom.UsoPorCliente && usoCliente.UsosCliente >= cupom.UsoPorCliente)) {
          return false;
        }
      }

      return true;
    });

    // Formatar resposta
    const cuponsFormatados = cuponsDisponiveis.map(cupom => ({
      CupomID: cupom.CupomID,
      Nome: cupom.Nome,
      Codigo: cupom.Codigo,
      Tipo: cupom.Tipo,
      DescontoTipo: cupom.DescontoTipo,
      DescontoValor: cupom.DescontoValor,
      DataExpiracao: cupom.DataExpiracao,
      Restricoes: cupom.Restricoes,
      UsosRestantes: cupom.LimiteUso ? cupom.LimiteUso - cupom.UsosAtuais : null,
      UsosClienteRestantes: cupom.Tipo === 'especifico' && cupom.cuponsCliente.length > 0
        ? (cupom.UsoPorCliente ? cupom.UsoPorCliente - cupom.cuponsCliente[0].UsosCliente : null)
        : null
    }));

    logger.info('listar_cupons_cliente_ok', { total: cuponsFormatados.length });
    res.json({ cupons: cuponsFormatados });
  } catch (error) {
    logControllerError('listar_cupons_cliente_error', error, req);
    res.status(500).json({ error: "Erro ao listar cupons disponíveis" });
  }
};

/**
 * Lista cupons do cliente (resgatados, disponíveis, atribuídos e públicos)
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupons do cliente
 */
export const listarCuponsCliente = async (req, res) => {
  try {
    const clienteId = req.user?.id;

    if (!clienteId) {
      return res.status(401).json({ error: "Cliente não autenticado" });
    }

    // Buscar categorias para mapear IDs para nomes
    const categorias = await prisma.categoria.findMany({
      select: {
        CategoriaID: true,
        Nome: true
      }
    });
    const categoriaMap = new Map(categorias.map(c => [c.CategoriaID, c.Nome]));

    // Buscar usos de cupons públicos pelo cliente
    const usosCliente = await prisma.pedido.groupBy({
      by: ['CupomID'],
      where: {
        ClienteID: clienteId,
        CupomID: { not: null }
      },
      _count: {
        PedidoID: true
      }
    });

    const usosMap = new Map(usosCliente.map(u => [u.CupomID, u._count.PedidoID]));

    // Buscar cupons atribuídos ao cliente
    const cuponsCliente = await prisma.cupomCliente.findMany({
      where: { ClienteID: clienteId },
      include: {
        cupom: {
          include: {
            vendedor: {
              select: {
                VendedorID: true,
                Nome: true
              }
            }
          }
        }
      },
      orderBy: { RecebidoEm: 'desc' }
    });

    // Buscar cupons públicos disponíveis
    const cuponsPublicos = await prisma.cupom.findMany({
      where: {
        Tipo: 'publico',
        Ativo: true,
        DataInicio: { lte: new Date() },
        OR: [
          { DataExpiracao: { gte: new Date() } },
          { DataExpiracao: null }
        ]
      },
      select: {
        CupomID: true,
        Nome: true,
        Codigo: true,
        DescontoTipo: true,
        DescontoValor: true,
        DataExpiracao: true,
        UsoPorCliente: true,
        Restricoes: true,
        LimiteUso: true,
        UsosAtuais: true,
        CriadoEm: true,
        vendedor: {
          select: {
            VendedorID: true,
            Nome: true
          }
        }
      },
      orderBy: { CriadoEm: 'desc' }
    });

    // Formatar cupons atribuídos - apenas disponíveis
    const cuponsAtribuidosFormatados = cuponsCliente
      .filter(cc => {
        // Filtrar apenas cupons não utilizados
        if (cc.Usado) return false;
        // Verificar se não excedeu o limite de uso por cliente
        if (cc.cupom.UsoPorCliente && cc.UsosCliente >= cc.cupom.UsoPorCliente) return false;
        // Verificar se o cupom ainda é válido (não expirou)
        if (cc.cupom.DataExpiracao && new Date(cc.cupom.DataExpiracao) < new Date()) return false;
        return true;
      })
      .map(cc => {
        const restricoes = cc.cupom.Restricoes ? { ...cc.cupom.Restricoes } : {};
        if (restricoes.categoriaId) {
          restricoes.categoriaNome = categoriaMap.get(restricoes.categoriaId) || `Categoria ${restricoes.categoriaId}`;
        }

        return {
          id: cc.CupomClienteID,
          code: cc.cupom.Codigo,
          discount: cc.cupom.DescontoValor,
          type: cc.cupom.DescontoTipo === 'porcentagem' ? 'percentage' : cc.cupom.DescontoTipo === 'valor_fixo' ? 'fixed' : 'free_shipping',
          description: cc.cupom.Nome,
          validUntil: cc.cupom.DataExpiracao,
          used: false, // Sempre false pois filtramos os usados
          minValue: cc.cupom.Restricoes?.valorMinimo || 0,
          status: 'available', // Sempre available pois filtramos os usados
          redeemedAt: cc.CriadoEm,
          usedAt: null, // Sempre null pois filtramos os usados
          canRedeem: true, // Sempre true pois são disponíveis
          vendedor: cc.cupom.vendedor ? cc.cupom.vendedor.Nome : 'Vendedor Digital',
          restricoes: restricoes,
          limiteUso: cc.cupom.LimiteUso,
          usoPorCliente: cc.cupom.UsoPorCliente,
          usosAtuais: cc.cupom.UsosAtuais,
          sortDate: cc.RecebidoEm
        };
      });

    // Formatar cupons públicos - apenas disponíveis
    const cuponsPublicosFormatados = cuponsPublicos
      .filter(cupom => {
        // Verificar se o cliente já usou o limite permitido
        const usosClienteCount = usosMap.get(cupom.CupomID) || 0;
        if (cupom.UsoPorCliente && usosClienteCount >= cupom.UsoPorCliente) return false;
        // Verificar limite total de uso
        if (cupom.LimiteUso && cupom.UsosAtuais >= cupom.LimiteUso) return false;
        return true;
      })
      .map(cupom => {
        const restricoes = cupom.Restricoes ? { ...cupom.Restricoes } : {};
        if (restricoes.categoriaId) {
          restricoes.categoriaNome = categoriaMap.get(restricoes.categoriaId) || `Categoria ${restricoes.categoriaId}`;
        }

        return {
          id: `public-${cupom.CupomID}`,
          code: cupom.Codigo,
          discount: cupom.DescontoValor,
          type: cupom.DescontoTipo === 'porcentagem' ? 'percentage' : cupom.DescontoTipo === 'valor_fixo' ? 'fixed' : 'free_shipping',
          description: cupom.Nome,
          validUntil: cupom.DataExpiracao,
          used: false, // Sempre false pois filtramos os usados
          minValue: cupom.Restricoes?.valorMinimo || 0,
          status: 'available', // Sempre available pois filtramos os usados
          redeemedAt: null,
          usedAt: null,
          canRedeem: true, // Sempre true pois são disponíveis
          vendedor: cupom.vendedor ? cupom.vendedor.Nome : 'Vendedor Digital',
          restricoes: restricoes,
          limiteUso: cupom.LimiteUso,
          usoPorCliente: cupom.UsoPorCliente,
          usosAtuais: cupom.UsosAtuais,
          sortDate: cupom.CriadoEm
        };
      });

    // Combinar e ordenar
    const cuponsFormatados = [...cuponsAtribuidosFormatados, ...cuponsPublicosFormatados]
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

    logger.info('listar_cupons_cliente_ok', { clienteId, total: cuponsFormatados.length });
    res.json({ success: true, data: cuponsFormatados });
  } catch (error) {
    logControllerError('listar_cupons_cliente_error', error, req);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Resgata um cupom para o cliente
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com cupom resgatado
 */
export const resgatarCupom = async (req, res) => {
  try {
    const { codigo } = req.body;
    const clienteId = req.user?.id;

    if (!clienteId) {
      return res.status(401).json({ error: "Cliente não autenticado" });
    }

    if (!codigo) {
      return res.status(400).json({ error: "Código do cupom é obrigatório" });
    }

    // Buscar o cupom por código
    const cupom = await prisma.cupom.findFirst({
      where: {
        Codigo: codigo,
        Ativo: true,
        DataInicio: { lte: new Date() },
        OR: [
          { DataExpiracao: null },
          { DataExpiracao: { gte: new Date() } }
        ]
      }
    });

    if (!cupom) {
      return res.status(404).json({ error: "Cupom não encontrado ou expirado" });
    }

    // Verificar se o cliente tem acesso ao cupom
    let cupomCliente = await prisma.cupomCliente.findFirst({
      where: {
        CupomID: cupom.CupomID,
        ClienteID: clienteId
      },
      include: { cupom: true }
    });

    // Para cupons específicos, deve existir uma atribuição
    if (cupom.Tipo === 'especifico') {
      if (!cupomCliente) {
        return res.status(403).json({ error: "Este cupom não está disponível para você" });
      }
    } else if (cupom.Tipo === 'publico') {
      // Para cupons públicos, criar entrada se não existir
      if (!cupomCliente) {
        cupomCliente = await prisma.cupomCliente.create({
          data: {
            CupomID: cupom.CupomID,
            ClienteID: clienteId,
            Resgatado: false,
            Usado: false,
            UsosCliente: 0
          },
          include: { cupom: true }
        });
      }
    }

    if (cupomCliente.Resgatado) {
      return res.status(400).json({ error: "Cupom já foi resgatado" });
    }

    // Resgatar o cupom
    const cupomAtualizado = await prisma.cupomCliente.update({
      where: { CupomClienteID: cupomCliente.CupomClienteID },
      data: { Resgatado: true },
      include: { cupom: true }
    });

    logger.info('resgatar_cupom_ok', { clienteId, codigo: cupom.Codigo });
    res.json({
      success: true,
      message: "Cupom resgatado com sucesso",
      data: {
        cupom: {
          Codigo: cupomAtualizado.cupom.Codigo,
          Nome: cupomAtualizado.cupom.Nome,
          DescontoTipo: cupomAtualizado.cupom.DescontoTipo,
          DescontoValor: cupomAtualizado.cupom.DescontoValor
        }
      }
    });
  } catch (error) {
    logControllerError('resgatar_cupom_error', error, req);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Lógica de validação de cupom (função utilitária)
 * @param {string} codigo - Código do cupom
 * @param {Array} itensCarrinho - Itens do carrinho (pode ser array de IDs ou objetos)
 * @param {number} valorTotal - Valor total do carrinho
 * @param {number} clienteId - ID do cliente
 * @returns {Object} Resultado da validação
 */
export const validarCupomLogic = async (codigo, itensCarrinho, valorTotal, clienteId) => {
  if (!clienteId) {
    throw new Error("Cliente não autenticado");
  }

  if (!codigo || typeof codigo !== 'string') {
    throw new Error("Código do cupom é obrigatório e deve ser uma string");
  }

  // Sanitize and validate coupon code
  const sanitizedCode = codigo.trim().toUpperCase();
  if (!sanitizedCode) {
    throw new Error("Código do cupom não pode estar vazio");
  }

  // Validate code format
  const codeRegex = /^[A-Z0-9_-]+$/;
  if (!codeRegex.test(sanitizedCode)) {
    throw new Error("Código do cupom contém caracteres inválidos");
  }

  // Validate code length
  if (sanitizedCode.length < 3 || sanitizedCode.length > 20) {
    throw new Error("Código do cupom deve ter entre 3 e 20 caracteres");
  }

  // Buscar cupom por código
  const cupom = await prisma.cupom.findFirst({
    where: {
      Codigo: sanitizedCode,
      Ativo: true,
      DataInicio: { lte: new Date() }, // Cupom deve ter iniciado
      OR: [
        { DataExpiracao: null },
        { DataExpiracao: { gte: new Date() } }
      ]
    },
    include: {
      cuponsCliente: {
        where: { ClienteID: clienteId }
      }
    }
  });

  if (!cupom) {
    return { valido: false, error: "Cupom não encontrado ou expirado" };
  }

  // Verificar se o cliente pode usar este cupom
  if (cupom.Tipo === 'especifico') {
    if (cupom.cuponsCliente.length === 0) {
      return { valido: false, error: "Este cupom não está disponível para você" };
    }

    const usoCliente = cupom.cuponsCliente[0];
    if (usoCliente.Usado || (cupom.UsoPorCliente && usoCliente.UsosCliente >= cupom.UsoPorCliente)) {
      return { valido: false, error: "Você já usou este cupom o máximo permitido" };
    }
  } else if (cupom.Tipo === 'publico') {
    // Para cupons públicos, verificar limite de uso por cliente
    if (cupom.UsoPorCliente) {
      // Contar quantas vezes o cliente já usou este cupom
      const usosCliente = await prisma.pedido.count({
        where: {
          ClienteID: clienteId,
          CupomID: cupom.CupomID
        }
      });

      if (usosCliente >= cupom.UsoPorCliente) {
        return { valido: false, error: "Você já usou este cupom o máximo permitido" };
      }
    }
  }

  // Verificar limite total de uso
  if (cupom.LimiteUso && cupom.UsosAtuais >= cupom.LimiteUso) {
    return { valido: false, error: "Este cupom atingiu o limite de uso" };
  }

  // Validar restrições baseadas no conteúdo do carrinho
  if (cupom.Restricoes) {
    // Restrição de categoria - verificar se há produtos da categoria restrita no carrinho
    if (cupom.Restricoes.categoriaId && itensCarrinho) {
      let temCategoria = false;
      let produtosValidos = [];

      if (Array.isArray(itensCarrinho) && itensCarrinho.length > 0) {
        if (typeof itensCarrinho[0] === 'number') {
          // itensCarrinho é array de IDs de produto, buscar categorias
          const produtos = await prisma.produto.findMany({
            where: { ProdutoID: { in: itensCarrinho } },
            select: { ProdutoID: true, CategoriaID: true, Nome: true }
          });
          produtosValidos = produtos.filter(produto => produto.CategoriaID === cupom.Restricoes.categoriaId);
          temCategoria = produtosValidos.length > 0;
        } else if (typeof itensCarrinho[0] === 'object') {
          // itensCarrinho é array de objetos, verificar diferentes formatos
          if (itensCarrinho[0].categoriaId !== undefined) {
            // Formato antigo: { categoriaId, ... }
            produtosValidos = itensCarrinho.filter(item => item.categoriaId === cupom.Restricoes.categoriaId);
            temCategoria = produtosValidos.length > 0;
          } else if (itensCarrinho[0].CategoriaID !== undefined) {
            // Formato do CartContext: { ProdutoID, CategoriaID, PrecoUnitario, Quantidade }
            produtosValidos = itensCarrinho.filter(item => item.CategoriaID === cupom.Restricoes.categoriaId);
            temCategoria = produtosValidos.length > 0;
          } else if (itensCarrinho[0].ProdutoID !== undefined) {
            // Mesmo formato, mas sem CategoriaID - buscar no banco
            const produtoIds = itensCarrinho.map(item => item.ProdutoID).filter(id => id);
            if (produtoIds.length > 0) {
              const produtos = await prisma.produto.findMany({
                where: { ProdutoID: { in: produtoIds } },
                select: { ProdutoID: true, CategoriaID: true, Nome: true }
              });
              produtosValidos = produtos.filter(produto => produto.CategoriaID === cupom.Restricoes.categoriaId);
              temCategoria = produtosValidos.length > 0;
            }
          }
        }
      }

      if (!temCategoria) {
        // Buscar nome da categoria para mensagem mais informativa
        const categoria = await prisma.categoria.findUnique({
          where: { CategoriaID: cupom.Restricoes.categoriaId },
          select: { Nome: true }
        });

        const nomeCategoria = categoria ? categoria.Nome : `categoria ${cupom.Restricoes.categoriaId}`;
        return {
          valido: false,
          error: `Este cupom é válido apenas para produtos da categoria "${nomeCategoria}"`
        };
      }
    }

    // Restrição de valor mínimo
    if (cupom.Restricoes.valorMinimo && valorTotal < cupom.Restricoes.valorMinimo) {
      return {
        valido: false,
        error: `Este cupom requer um valor mínimo de compra de R$ ${cupom.Restricoes.valorMinimo.toFixed(2)}`
      };
    }
  }

  // Calcular desconto baseado no tipo
  let desconto = 0;
  let valorFinal = valorTotal;

  if (cupom.DescontoTipo === 'porcentagem') {
    desconto = (valorTotal * cupom.DescontoValor) / 100;
    valorFinal = Math.max(0, valorTotal - desconto);
  } else if (cupom.DescontoTipo === 'valor_fixo') {
    desconto = Math.min(cupom.DescontoValor, valorTotal);
    valorFinal = Math.max(0, valorTotal - desconto);
  } else if (cupom.DescontoTipo === 'frete_gratis') {
    // Desconto de frete será calculado no checkout
    desconto = 0;
    valorFinal = valorTotal; // Frete grátis não afeta o subtotal dos produtos
  }

  const resultado = {
    cupom: {
      CupomID: cupom.CupomID,
      Codigo: cupom.Codigo,
      Nome: cupom.Nome,
      DescontoTipo: cupom.DescontoTipo,
      DescontoValor: cupom.DescontoValor,
      TipoDesconto: cupom.DescontoTipo, // Adicionado para compatibilidade
      Restricoes: cupom.Restricoes
    },
    desconto: desconto,
    valorFinal: valorFinal,
    valido: true
  };

  logger.info('validar_cupom_logic_ok', {
    codigo: sanitizedCode,
    clienteId,
    descontoTipo: cupom.DescontoTipo,
    descontoValor: desconto
  });
  return resultado;
};

/**
 * Valida e aplica cupom a um carrinho/pedido (handler Express)
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com resultado da validação
 */
export const validarCupom = async (req, res) => {
  try {
    const { codigo, itensCarrinho, valorTotal } = req.body;
    const clienteId = req.user?.id;

    const resultado = await validarCupomLogic(codigo, itensCarrinho, valorTotal, clienteId);

    if (!resultado.valido) {
      return res.json(resultado);
    }

    logger.info('validar_cupom_ok', { codigo, clienteId });
    res.json(resultado);
  } catch (error) {
    logControllerError('validar_cupom_error', error, req);
    res.status(500).json({ error: "Erro ao validar cupom" });
  }
};

export default {
  listarCupons,
  buscarCupomPorId,
  criarCupom,
  atualizarCupom,
  excluirCupom,
  toggleCupomStatus,
  listarClientesParaCupom,
  listarCuponsDisponiveisCliente,
  listarCuponsCliente,
  resgatarCupom,
  validarCupom
};