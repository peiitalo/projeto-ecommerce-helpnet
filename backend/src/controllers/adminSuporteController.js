// backend/src/controllers/adminSuporteController.js
import prisma from '../config/prisma.js';
import { logControllerError, logger } from '../utils/logger.js';

// Listar mensagens de suporte (dúvidas dos clientes)
export const listarMensagensSuporte = async (req, res) => {
  try {
    // Verificação de admin removida temporariamente para MVP

    const { tipo, status, pagina = 1, limite = 20 } = req.query;

    const where = {};
    if (tipo && ['DUVIDA', 'COMENTARIO_PLATAFORMA'].includes(tipo)) {
      where.Tipo = tipo;
    }
    if (status && ['PENDENTE', 'RESPONDIDO', 'RESOLVIDO'].includes(status)) {
      where.Status = status;
    }

    const mensagens = await prisma.mensagemSuporte.findMany({
      where,
      include: {
        cliente: {
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true
          }
        },
        admin: {
          select: {
            AdminID: true,
            Nome: true
          }
        }
      },
      orderBy: {
        CriadoEm: 'desc'
      },
      skip: (pagina - 1) * limite,
      take: parseInt(limite)
    });

    const total = await prisma.mensagemSuporte.count({ where });

    res.json({
      success: true,
      mensagens,
      paginacao: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        totalPaginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    logControllerError('listar_mensagens_suporte_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Responder mensagem de suporte
export const responderMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { resposta } = req.body;
    const adminId = req.user?.id; // Admin autenticado

    if (!resposta || !resposta.trim()) {
      return res.status(400).json({ success: false, errors: ['Resposta é obrigatória'] });
    }

    const mensagem = await prisma.mensagemSuporte.findUnique({
      where: { MensagemID: parseInt(id) }
    });

    if (!mensagem) {
      return res.status(404).json({ success: false, errors: ['Mensagem não encontrada'] });
    }

    const mensagemAtualizada = await prisma.mensagemSuporte.update({
      where: { MensagemID: parseInt(id) },
      data: {
        Resposta: resposta,
        RespondidoPor: adminId,
        RespondidoEm: new Date(),
        Status: 'RESPONDIDO'
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
          }
        },
        admin: {
          select: {
            Nome: true
          }
        }
      }
    });

    logger.info('mensagem_suporte_respondida', { mensagemId: id, adminId });

    res.json({
      success: true,
      message: 'Mensagem respondida com sucesso',
      data: mensagemAtualizada
    });
  } catch (error) {
    logControllerError('responder_mensagem_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Marcar mensagem como resolvida
export const marcarComoResolvida = async (req, res) => {
  try {
    const { id } = req.params;

    const mensagem = await prisma.mensagemSuporte.findUnique({
      where: { MensagemID: parseInt(id) }
    });

    if (!mensagem) {
      return res.status(404).json({ success: false, errors: ['Mensagem não encontrada'] });
    }

    const mensagemAtualizada = await prisma.mensagemSuporte.update({
      where: { MensagemID: parseInt(id) },
      data: {
        Status: 'RESOLVIDO'
      }
    });

    logger.info('mensagem_suporte_resolvida', { mensagemId: id });

    res.json({
      success: true,
      message: 'Mensagem marcada como resolvida',
      data: mensagemAtualizada
    });
  } catch (error) {
    logControllerError('marcar_resolvida_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Listar avaliações da plataforma
export const listarAvaliacoesPlataforma = async (req, res) => {
  try {
    // Verificação de admin removida temporariamente para MVP
    const { pagina = 1, limite = 20, exibirSite } = req.query;

    const where = {};
    if (exibirSite !== undefined) {
      where.ExibirSite = exibirSite === 'true';
    }

    const avaliacoes = await prisma.avaliacaoPlataforma.findMany({
      where,
      include: {
        cliente: {
          select: {
            ClienteID: true,
            NomeCompleto: true,
            Email: true
          }
        }
      },
      orderBy: {
        CriadoEm: 'desc'
      },
      skip: (pagina - 1) * limite,
      take: parseInt(limite)
    });

    const total = await prisma.avaliacaoPlataforma.count({ where });

    res.json({
      success: true,
      avaliacoes,
      paginacao: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        totalPaginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    logControllerError('listar_avaliacoes_plataforma_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Aprovar/reprovar exibição de avaliação no site
export const gerenciarExibicaoAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { exibirSite } = req.body;

    if (typeof exibirSite !== 'boolean') {
      return res.status(400).json({ success: false, errors: ['exibirSite deve ser true ou false'] });
    }

    const avaliacao = await prisma.avaliacaoPlataforma.findUnique({
      where: { AvaliacaoID: parseInt(id) }
    });

    if (!avaliacao) {
      return res.status(404).json({ success: false, errors: ['Avaliação não encontrada'] });
    }

    const avaliacaoAtualizada = await prisma.avaliacaoPlataforma.update({
      where: { AvaliacaoID: parseInt(id) },
      data: {
        ExibirSite: exibirSite
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true
          }
        }
      }
    });

    logger.info('avaliacao_exibicao_alterada', { avaliacaoId: id, exibirSite });

    res.json({
      success: true,
      message: `Avaliação ${exibirSite ? 'aprovada' : 'reprovada'} para exibição no site`,
      data: avaliacaoAtualizada
    });
  } catch (error) {
    logControllerError('gerenciar_exibicao_avaliacao_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Estatísticas do suporte
export const estatisticasSuporte = async (req, res) => {
  try {
    // Verificação de admin removida temporariamente para MVP
    const [totalMensagens, mensagensPendentes, mensagensRespondidas, mensagensResolvidas, totalAvaliacoes, mediaAvaliacoes] = await Promise.all([
      prisma.mensagemSuporte.count(),
      prisma.mensagemSuporte.count({ where: { Status: 'PENDENTE' } }),
      prisma.mensagemSuporte.count({ where: { Status: 'RESPONDIDO' } }),
      prisma.mensagemSuporte.count({ where: { Status: 'RESOLVIDO' } }),
      prisma.avaliacaoPlataforma.count(),
      prisma.avaliacaoPlataforma.aggregate({
        _avg: { Nota: true }
      })
    ]);

    const distribuicaoAvaliacoes = await prisma.avaliacaoPlataforma.groupBy({
      by: ['Nota'],
      _count: { Nota: true }
    });

    res.json({
      success: true,
      estatisticas: {
        mensagens: {
          total: totalMensagens,
          pendentes: mensagensPendentes,
          respondidas: mensagensRespondidas,
          resolvidas: mensagensResolvidas
        },
        avaliacoes: {
          total: totalAvaliacoes,
          media: mediaAvaliacoes._avg.Nota || 0,
          distribuicao: distribuicaoAvaliacoes.reduce((acc, item) => {
            acc[item.Nota] = item._count.Nota;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    logControllerError('estatisticas_suporte_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};