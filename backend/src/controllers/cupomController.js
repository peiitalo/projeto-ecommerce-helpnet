<<<<<<< HEAD
// backend/src/controllers/cupomController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
=======
import prisma from '../config/prisma.js';
>>>>>>> 82672d343b6be74c079cf881125d14baa85e7b74

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
      orderBy: { CriadoEm: 'desc' }
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
 * Valida e aplica cupom a um carrinho/pedido
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com resultado da validação
 */
export const validarCupom = async (req, res) => {
  try {
    const { codigo, itensCarrinho, valorTotal } = req.body;
    const clienteId = req.user?.id;

    if (!clienteId) {
      return res.status(401).json({ error: "Cliente não autenticado" });
    }

    if (!codigo) {
      return res.status(400).json({ error: "Código do cupom é obrigatório" });
    }

    // Buscar cupom por código
    const cupom = await prisma.cupom.findFirst({
      where: {
        Codigo: codigo,
        Ativo: true,
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
      return res.status(404).json({ error: "Cupom não encontrado ou expirado" });
    }

    // Verificar se o cliente pode usar este cupom
    if (cupom.Tipo === 'especifico') {
      if (cupom.cuponsCliente.length === 0) {
        return res.status(403).json({ error: "Este cupom não está disponível para você" });
      }

      const usoCliente = cupom.cuponsCliente[0];
      if (usoCliente.Usado || (cupom.UsoPorCliente && usoCliente.UsosCliente >= cupom.UsoPorCliente)) {
        return res.status(403).json({ error: "Você já usou este cupom o máximo permitido" });
      }
    }

    // Verificar limite total de uso
    if (cupom.LimiteUso && cupom.UsosAtuais >= cupom.LimiteUso) {
      return res.status(403).json({ error: "Este cupom atingiu o limite de uso" });
    }

    // Validar restrições
    if (cupom.Restricoes) {
      // Restrição de categoria
      if (cupom.Restricoes.categoriaId && itensCarrinho) {
        const temCategoria = itensCarrinho.some(item =>
          item.categoriaId === cupom.Restricoes.categoriaId
        );
        if (!temCategoria) {
          return res.status(403).json({
            error: "Este cupom é válido apenas para produtos de uma categoria específica"
          });
        }
      }

      // Restrição de valor mínimo
      if (cupom.Restricoes.valorMinimo && valorTotal < cupom.Restricoes.valorMinimo) {
        return res.status(403).json({
          error: `Este cupom requer um valor mínimo de compra de R$ ${cupom.Restricoes.valorMinimo.toFixed(2)}`
        });
      }
    }

    // Calcular desconto
    let desconto = 0;
    if (cupom.DescontoTipo === 'porcentagem') {
      desconto = (valorTotal * cupom.DescontoValor) / 100;
    } else if (cupom.DescontoTipo === 'valor_fixo') {
      desconto = Math.min(cupom.DescontoValor, valorTotal);
    } else if (cupom.DescontoTipo === 'frete_gratis') {
      // Desconto de frete será calculado no checkout
      desconto = 0;
    }

    const resultado = {
      cupom: {
        CupomID: cupom.CupomID,
        Codigo: cupom.Codigo,
        Nome: cupom.Nome,
        DescontoTipo: cupom.DescontoTipo,
        DescontoValor: cupom.DescontoValor
      },
      desconto: desconto,
      valorFinal: Math.max(0, valorTotal - desconto),
      valido: true
    };

    logger.info('validar_cupom_ok', { codigo: cupom.Codigo, clienteId });
    res.json(resultado);
  } catch (error) {
    logControllerError('validar_cupom_error', error, req);
    res.status(500).json({ error: "Erro ao validar cupom" });
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