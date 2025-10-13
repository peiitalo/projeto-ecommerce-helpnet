// backend/src/controllers/sistemaAvaliacaoController.js
import prisma from "../config/prisma.js";
import { logger } from '../utils/logger.js';
import emailService, { loadTemplate, sendEmail } from '../services/emailService.js';

const logControllerError = (operation, error, req) => {
  logger.error(`sistema_avaliacao_controller_${operation}_error`, {
    error: error.message,
    stack: error.stack,
    body: req?.body,
    params: req?.params,
    query: req?.query
  });
};

// Criar avaliação do sistema
export const criarAvaliacaoSistema = async (req, res) => {
  try {
    const { nome, email, estrelas, comentario, comment } = req.body;
    // Handle both possible field names (comment from frontend, comentario for consistency)
    const comentarioFinal = comentario || comment;

    // Validações básicas
    if (!nome || !email || !estrelas || !comentarioFinal) {
      return res.status(400).json({
        success: false,
        errors: ["Todos os campos são obrigatórios"]
      });
    }

    if (estrelas < 1 || estrelas > 5) {
      return res.status(400).json({
        success: false,
        errors: ["Avaliação deve ser entre 1 e 5 estrelas"]
      });
    }

    // Criar avaliação
    const avaliacao = await prisma.sistemaAvaliacao.create({
      data: {
        Nome: nome,
        Email: email,
        Estrelas: estrelas,
        Comentario: comentarioFinal,
        Aprovado: false, // Sempre começa como não aprovado para moderação
        ExibirLanding: estrelas >= 4 // 4-5 estrelas aparecem na landing automaticamente
      }
    });

    // Enviar email de confirmação
    try {
      const { compiledTemplate, compiledBase } = loadTemplate('avaliacao-recebida');
      const htmlContent = compiledBase({
        title: 'Obrigado pela sua avaliação - HelpNet',
        body: compiledTemplate({
          nome,
          estrelas,
          comentario: comentarioFinal
        }),
        showUnsubscribe: false
      });

      await sendEmail(email, 'Obrigado pela sua avaliação - HelpNet', htmlContent);
    } catch (emailError) {
      logger.warn('Erro ao enviar email de confirmação da avaliação', { emailError });
      // Não falha a operação por causa do email
    }

    res.status(201).json({
      success: true,
      message: "Avaliação enviada com sucesso! Obrigado pelo feedback.",
      data: {
        id: avaliacao.AvaliacaoID,
        estrelas: avaliacao.Estrelas,
        comentario: avaliacao.Comentario
      }
    });

  } catch (error) {
    logControllerError('criar_avaliacao_sistema', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter avaliações aprovadas para landing page
export const obterAvaliacoesLanding = async (req, res) => {
  try {
    const avaliacoes = await prisma.sistemaAvaliacao.findMany({
      where: {
        Aprovado: true,
        ExibirLanding: true
      },
      select: {
        Nome: true,
        Estrelas: true,
        Comentario: true,
        CriadoEm: true
      },
      orderBy: {
        CriadoEm: 'desc'
      },
      take: 6 // Limitar para não sobrecarregar a landing page
    });

    // Formatar para o frontend
    const avaliacoesFormatadas = avaliacoes.map(avaliacao => ({
      nome: avaliacao.Nome,
      comentario: avaliacao.Comentario,
      estrelas: avaliacao.Estrelas,
      tipo: "Cliente Verificado"
    }));

    res.json({
      success: true,
      depoimentos: avaliacoesFormatadas
    });

  } catch (error) {
    logControllerError('obter_avaliacoes_landing', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter todas as avaliações (para admin)
export const obterTodasAvaliacoes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const where = {};
    if (status === 'aprovadas') {
      where.Aprovado = true;
    } else if (status === 'pendentes') {
      where.Aprovado = false;
    }

    const [avaliacoes, total] = await Promise.all([
      prisma.sistemaAvaliacao.findMany({
        where,
        orderBy: {
          CriadoEm: 'desc'
        },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.sistemaAvaliacao.count({ where })
    ]);

    res.json({
      success: true,
      data: avaliacoes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logControllerError('obter_todas_avaliacoes', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Obter avaliações públicas com filtros (para página de suporte)
export const obterAvaliacoesPublicas = async (req, res) => {
  try {
    const { page = 1, limit = 10, estrelas } = req.query;

    const where = {
      Aprovado: true
    };

    // Filtro por estrelas
    if (estrelas) {
      if (estrelas === '1-3') {
        where.Estrelas = { lte: 3 };
      } else if (estrelas === '3-5') {
        where.Estrelas = { gte: 3 };
      } else {
        const estrelasNum = parseInt(estrelas);
        if (estrelasNum >= 1 && estrelasNum <= 5) {
          where.Estrelas = estrelasNum;
        }
      }
    }

    const [avaliacoes, total] = await Promise.all([
      prisma.sistemaAvaliacao.findMany({
        where,
        select: {
          AvaliacaoID: true,
          Nome: true,
          Estrelas: true,
          Comentario: true,
          CriadoEm: true
        },
        orderBy: {
          CriadoEm: 'desc'
        },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.sistemaAvaliacao.count({ where })
    ]);

    res.json({
      success: true,
      data: avaliacoes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logControllerError('obter_avaliacoes_publicas', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Aprovar/reprovar avaliação (para admin)
export const atualizarStatusAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprovado, exibirLanding } = req.body;

    const avaliacao = await prisma.sistemaAvaliacao.update({
      where: { AvaliacaoID: parseInt(id) },
      data: {
        Aprovado: aprovado,
        ExibirLanding: exibirLanding !== undefined ? exibirLanding : (aprovado && avaliacao.Estrelas >= 4)
      }
    });

    res.json({
      success: true,
      message: `Avaliação ${aprovado ? 'aprovada' : 'reprovada'} com sucesso`,
      data: avaliacao
    });

  } catch (error) {
    logControllerError('atualizar_status_avaliacao', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Deletar avaliação (para admin)
export const deletarAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sistemaAvaliacao.delete({
      where: { AvaliacaoID: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Avaliação deletada com sucesso"
    });

  } catch (error) {
    logControllerError('deletar_avaliacao', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};