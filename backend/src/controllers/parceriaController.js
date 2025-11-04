// backend/src/controllers/parceriaController.js
import prisma from "../config/prisma.js";
import { logger } from '../utils/logger.js';

const logControllerError = (operation, error, req) => {
  logger.error(`parceria_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    userId: req?.user?.id,
    vendedorId: req?.user?.vendedorId,
    empresaId: req?.user?.empresaId,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Listar parcerias ativas e pendentes do vendedor
export const listarParcerias = async (req, res) => {
  try {
    const { user } = req;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    // Buscar parcerias onde o usuário é solicitante ou convidado
    const parcerias = await prisma.parceriaVendedor.findMany({
      where: {
        OR: [
          { SolicitanteID: user.vendedorId },
          { ConvidadoID: user.vendedorId }
        ]
      },
      include: {
        solicitante: {
          select: {
            VendedorID: true,
            Nome: true,
            Email: true
          }
        },
        convidado: {
          select: {
            VendedorID: true,
            Nome: true,
            Email: true
          }
        }
      },
      orderBy: { DataCriacao: 'desc' }
    });

    // Separar parcerias ativas das pendentes
    const parceriasAtivas = parcerias.filter(p => p.Status === 'ATIVA');
    const parceriasPendentes = parcerias.filter(p => p.Status === 'PENDENTE');

    // Formatar resposta
    const formatarParceria = (parceria) => {
      const isSolicitante = parceria.SolicitanteID === user.vendedorId;
      const outroVendedor = isSolicitante ? parceria.convidado : parceria.solicitante;

      return {
        id: parceria.ParceriaID.toString(),
        parceiro: {
          id: outroVendedor.VendedorID.toString(),
          nome: outroVendedor.Nome,
          email: outroVendedor.Email
        },
        status: parceria.Status,
        percentual: isSolicitante
          ? { meu: parceria.PercentualSolicitante, parceiro: parceria.PercentualConvidado }
          : { meu: parceria.PercentualConvidado, parceiro: parceria.PercentualSolicitante },
        dataCriacao: parceria.DataCriacao.toISOString(),
        dataAceitacao: parceria.DataAceitacao?.toISOString(),
        mensagem: parceria.Mensagem,
        souSolicitante: isSolicitante
      };
    };

    res.json({
      success: true,
      parcerias: {
        ativas: parceriasAtivas.map(formatarParceria),
        pendentes: parceriasPendentes.map(formatarParceria)
      }
    });

  } catch (error) {
    logControllerError('listar_parcerias', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Enviar solicitação de parceria
export const enviarSolicitacaoParceria = async (req, res) => {
  try {
    const { user } = req;
    const { vendedorId, percentualMeu, percentualParceiro, mensagem } = req.body;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    // Validações
    if (!vendedorId || percentualMeu == null || percentualParceiro == null) {
      return res.status(400).json({
        success: false,
        errors: ["Vendedor, percentuais são obrigatórios"]
      });
    }

    if (percentualMeu + percentualParceiro !== 100) {
      return res.status(400).json({
        success: false,
        errors: ["A soma dos percentuais deve ser 100%"]
      });
    }

    if (percentualMeu <= 0 || percentualParceiro <= 0) {
      return res.status(400).json({
        success: false,
        errors: ["Os percentuais devem ser maiores que zero"]
      });
    }

    // Verificar se o vendedor existe
    const vendedorConvidado = await prisma.vendedor.findUnique({
      where: { VendedorID: parseInt(vendedorId) }
    });

    if (!vendedorConvidado) {
      return res.status(404).json({
        success: false,
        errors: ["Vendedor não encontrado"]
      });
    }

    // Verificar se já existe uma parceria entre eles
    const parceriaExistente = await prisma.parceriaVendedor.findFirst({
      where: {
        OR: [
          { SolicitanteID: user.vendedorId, ConvidadoID: parseInt(vendedorId) },
          { SolicitanteID: parseInt(vendedorId), ConvidadoID: user.vendedorId }
        ]
      }
    });

    if (parceriaExistente) {
      return res.status(400).json({
        success: false,
        errors: ["Já existe uma parceria ou solicitação pendente entre vocês"]
      });
    }

    // Criar solicitação de parceria
    const parceria = await prisma.parceriaVendedor.create({
      data: {
        SolicitanteID: user.vendedorId,
        ConvidadoID: parseInt(vendedorId),
        PercentualSolicitante: percentualMeu,
        PercentualConvidado: percentualParceiro,
        Mensagem: mensagem || null
      },
      include: {
        solicitante: {
          select: { VendedorID: true, Nome: true, Email: true }
        },
        convidado: {
          select: { VendedorID: true, Nome: true, Email: true }
        }
      }
    });

    logger.info('solicitacao_parceria_enviada', {
      solicitanteId: user.vendedorId,
      convidadoId: parseInt(vendedorId),
      parceriaId: parceria.ParceriaID
    });

    res.status(201).json({
      success: true,
      message: 'Solicitação de parceria enviada com sucesso',
      parceria: {
        id: parceria.ParceriaID.toString(),
        parceiro: {
          id: parceria.convidado.VendedorID.toString(),
          nome: parceria.convidado.Nome,
          email: parceria.convidado.Email
        },
        status: parceria.Status,
        percentual: {
          meu: parceria.PercentualSolicitante,
          parceiro: parceria.PercentualConvidado
        },
        dataCriacao: parceria.DataCriacao.toISOString(),
        mensagem: parceria.Mensagem
      }
    });

  } catch (error) {
    logControllerError('enviar_solicitacao_parceria', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Aceitar ou recusar solicitação de parceria
export const responderSolicitacaoParceria = async (req, res) => {
  try {
    const { user } = req;
    const { parceriaId } = req.params;
    const { acao } = req.body; // 'aceitar' ou 'recusar'

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    if (!['aceitar', 'recusar'].includes(acao)) {
      return res.status(400).json({
        success: false,
        errors: ["Ação deve ser 'aceitar' ou 'recusar'"]
      });
    }

    // Buscar parceria
    const parceria = await prisma.parceriaVendedor.findUnique({
      where: { ParceriaID: parseInt(parceriaId) },
      include: {
        solicitante: {
          select: { VendedorID: true, Nome: true, Email: true }
        },
        convidado: {
          select: { VendedorID: true, Nome: true, Email: true }
        }
      }
    });

    if (!parceria) {
      return res.status(404).json({
        success: false,
        errors: ["Parceria não encontrada"]
      });
    }

    // Verificar se o usuário é o convidado
    if (parceria.ConvidadoID !== user.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Você não tem permissão para responder esta solicitação"]
      });
    }

    // Verificar se a parceria ainda está pendente
    if (parceria.Status !== 'PENDENTE') {
      return res.status(400).json({
        success: false,
        errors: ["Esta solicitação já foi respondida"]
      });
    }

    // Atualizar status da parceria
    const novoStatus = acao === 'aceitar' ? 'ATIVA' : 'RECUSADA';
    const dataAtualizacao = acao === 'aceitar' ? { DataAceitacao: new Date() } : {};

    const parceriaAtualizada = await prisma.parceriaVendedor.update({
      where: { ParceriaID: parseInt(parceriaId) },
      data: {
        Status: novoStatus,
        ...dataAtualizacao
      },
      include: {
        solicitante: {
          select: { VendedorID: true, Nome: true, Email: true }
        },
        convidado: {
          select: { VendedorID: true, Nome: true, Email: true }
        }
      }
    });

    // Se a parceria foi aceita, criar notificação para o solicitante
    if (acao === 'aceitar') {
      await prisma.notificacao.create({
        data: {
          Titulo: 'Parceria Aceita',
          Mensagem: `Sua solicitação de parceria com ${parceriaAtualizada.convidado.Nome} foi aceita!`,
          Tipo: 'success',
          VendedorID: parceriaAtualizada.SolicitanteID
        }
      });
    } else {
      // Se foi recusada, criar notificação para o solicitante
      await prisma.notificacao.create({
        data: {
          Titulo: 'Parceria Recusada',
          Mensagem: `Sua solicitação de parceria com ${parceriaAtualizada.convidado.Nome} foi recusada.`,
          Tipo: 'warning',
          VendedorID: parceriaAtualizada.SolicitanteID
        }
      });
    }

    logger.info('solicitacao_parceria_respondida', {
      parceriaId: parseInt(parceriaId),
      acao,
      novoStatus
    });

    res.json({
      success: true,
      message: `Solicitação ${acao === 'aceitar' ? 'aceita' : 'recusada'} com sucesso`,
      parceria: {
        id: parceriaAtualizada.ParceriaID.toString(),
        parceiro: {
          id: parceriaAtualizada.solicitante.VendedorID.toString(),
          nome: parceriaAtualizada.solicitante.Nome,
          email: parceriaAtualizada.solicitante.Email
        },
        status: parceriaAtualizada.Status,
        percentual: {
          meu: parceriaAtualizada.PercentualConvidado,
          parceiro: parceriaAtualizada.PercentualSolicitante
        },
        dataCriacao: parceriaAtualizada.DataCriacao.toISOString(),
        dataAceitacao: parceriaAtualizada.DataAceitacao?.toISOString(),
        mensagem: parceriaAtualizada.Mensagem
      }
    });

  } catch (error) {
    logControllerError('responder_solicitacao_parceria', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Encerrar parceria
export const encerrarParceria = async (req, res) => {
  try {
    const { user } = req;
    const { parceriaId } = req.params;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    // Buscar parceria
    const parceria = await prisma.parceriaVendedor.findUnique({
      where: { ParceriaID: parseInt(parceriaId) }
    });

    if (!parceria) {
      return res.status(404).json({
        success: false,
        errors: ["Parceria não encontrada"]
      });
    }

    // Verificar se o usuário faz parte da parceria
    if (parceria.SolicitanteID !== user.vendedorId && parceria.ConvidadoID !== user.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Você não tem permissão para encerrar esta parceria"]
      });
    }

    // Verificar se a parceria está ativa
    if (parceria.Status !== 'ATIVA') {
      return res.status(400).json({
        success: false,
        errors: ["Esta parceria não está ativa"]
      });
    }

    // Encerrar parceria
    const parceriaEncerrada = await prisma.parceriaVendedor.update({
      where: { ParceriaID: parseInt(parceriaId) },
      data: {
        Status: 'ENCERRADA',
        DataEncerramento: new Date()
      },
      include: {
        solicitante: {
          select: { VendedorID: true, Nome: true, Email: true }
        },
        convidado: {
          select: { VendedorID: true, Nome: true, Email: true }
        }
      }
    });

    // Criar notificações para ambos os parceiros sobre o encerramento
    const outroParceiroId = parceriaEncerrada.SolicitanteID === user.vendedorId
      ? parceriaEncerrada.ConvidadoID
      : parceriaEncerrada.SolicitanteID;

    const outroParceiroNome = parceriaEncerrada.SolicitanteID === user.vendedorId
      ? parceriaEncerrada.convidado.Nome
      : parceriaEncerrada.solicitante.Nome;

    await prisma.notificacao.create({
      data: {
        Titulo: 'Parceria Encerrada',
        Mensagem: `A parceria com ${outroParceiroNome} foi encerrada.`,
        Tipo: 'info',
        VendedorID: user.vendedorId
      }
    });

    await prisma.notificacao.create({
      data: {
        Titulo: 'Parceria Encerrada',
        Mensagem: `A parceria com ${parceriaEncerrada.SolicitanteID === user.vendedorId ? parceriaEncerrada.solicitante.Nome : parceriaEncerrada.convidado.Nome} foi encerrada.`,
        Tipo: 'info',
        VendedorID: outroParceiroId
      }
    });

    logger.info('parceria_encerrada', {
      parceriaId: parseInt(parceriaId),
      encerradoPor: user.vendedorId
    });

    res.json({
      success: true,
      message: 'Parceria encerrada com sucesso'
    });

  } catch (error) {
    logControllerError('encerrar_parceria', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Listar produtos compartilhados com parceiros
export const listarProdutosCompartilhados = async (req, res) => {
  try {
    const { user } = req;

    if (!user?.vendedorId) {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Vendedor não identificado."]
      });
    }

    // Buscar parcerias ativas (apenas ATIVA, não ENCERRADA)
    const parceriasAtivas = await prisma.parceriaVendedor.findMany({
      where: {
        OR: [
          { SolicitanteID: user.vendedorId, Status: 'ATIVA' },
          { ConvidadoID: user.vendedorId, Status: 'ATIVA' }
        ]
      },
      select: {
        SolicitanteID: true,
        ConvidadoID: true
      }
    });

    // Extrair IDs dos parceiros (apenas se a parceria estiver ATIVA)
    const parceirosIds = parceriasAtivas.map(p =>
      p.SolicitanteID === user.vendedorId ? p.ConvidadoID : p.SolicitanteID
    );

    if (parceirosIds.length === 0) {
      return res.json({
        success: true,
        produtos: []
      });
    }

    // Buscar produtos dos parceiros
    const produtos = await prisma.produto.findMany({
      where: {
        VendedorID: { in: parceirosIds },
        Ativo: true
      },
      include: {
        categoria: {
          select: { Nome: true }
        },
        vendedor: {
          select: {
            VendedorID: true,
            Nome: true,
            Email: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    // Formatar produtos
    const produtosFormatados = produtos.map(produto => ({
      id: produto.ProdutoID.toString(),
      nome: produto.Nome,
      descricao: produto.Descricao,
      breveDescricao: produto.BreveDescricao,
      preco: produto.Preco,
      precoOriginal: produto.PrecoOriginal,
      estoque: produto.Estoque,
      categoria: produto.categoria?.Nome,
      vendedor: {
        id: produto.vendedor.VendedorID.toString(),
        nome: produto.vendedor.Nome,
        email: produto.vendedor.Email
      },
      imagens: produto.Imagens,
      ativo: produto.Ativo,
      criadoEm: produto.criadoEm.toISOString()
    }));

    res.json({
      success: true,
      produtos: produtosFormatados
    });

  } catch (error) {
    logControllerError('listar_produtos_compartilhados', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};