// backend/src/controllers/suporteController.js
import prisma from '../config/prisma.js';
import { logControllerError, logger } from '../utils/logger.js';

// Enviar mensagem de suporte (dúvida ou comentário da plataforma)
export const enviarMensagem = async (req, res) => {
  try {
    const { user } = req;
    const { tipo, assunto, mensagem } = req.body;

    if (!tipo || !['DUVIDA', 'COMENTARIO_PLATAFORMA'].includes(tipo)) {
      return res.status(400).json({ success: false, errors: ['Tipo deve ser DUVIDA ou COMENTARIO_PLATAFORMA'] });
    }

    if (!assunto || !mensagem) {
      return res.status(400).json({ success: false, errors: ['Assunto e mensagem são obrigatórios'] });
    }

    const novaMensagem = await prisma.mensagemSuporte.create({
      data: {
        ClienteID: user.id,
        Tipo: tipo,
        Assunto: assunto,
        Mensagem: mensagem,
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
          }
        }
      }
    });

    logger.info('mensagem_suporte_enviada', { clienteId: user.id, tipo, assunto });

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: novaMensagem
    });
  } catch (error) {
    logControllerError('enviar_mensagem_suporte_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Avaliar plataforma (5 estrelas)
export const avaliarPlataforma = async (req, res) => {
  try {
    const { user } = req;
    const { nota, comentario, exibirSite } = req.body;

    if (!nota || nota < 1 || nota > 5) {
      return res.status(400).json({ success: false, errors: ['Nota deve ser entre 1 e 5'] });
    }

    // Verificar se usuário já avaliou
    const avaliacaoExistente = await prisma.avaliacaoPlataforma.findFirst({
      where: { ClienteID: user.id }
    });

    let avaliacao;
    if (avaliacaoExistente) {
      // Atualizar avaliação existente
      avaliacao = await prisma.avaliacaoPlataforma.update({
        where: { AvaliacaoID: avaliacaoExistente.AvaliacaoID },
        data: {
          Nota: nota,
          Comentario: comentario || null,
          ExibirSite: exibirSite || false,
        },
        include: {
          cliente: {
            select: {
              NomeCompleto: true
            }
          }
        }
      });
    } else {
      // Criar nova avaliação
      avaliacao = await prisma.avaliacaoPlataforma.create({
        data: {
          ClienteID: user.id,
          Nota: nota,
          Comentario: comentario || null,
          ExibirSite: exibirSite || false,
        },
        include: {
          cliente: {
            select: {
              NomeCompleto: true
            }
          }
        }
      });
    }

    logger.info('avaliacao_plataforma_enviada', { clienteId: user.id, nota });

    res.status(201).json({
      success: true,
      message: 'Avaliação enviada com sucesso',
      data: avaliacao
    });
  } catch (error) {
    logControllerError('avaliar_plataforma_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Buscar mensagens de suporte do cliente
export const buscarMinhasMensagens = async (req, res) => {
  try {
    const { user } = req;

    const mensagens = await prisma.mensagemSuporte.findMany({
      where: { ClienteID: user.id },
      orderBy: { CriadoEm: 'desc' },
      include: {
        admin: {
          select: {
            Nome: true
          }
        }
      }
    });

    res.json({
      success: true,
      mensagens
    });
  } catch (error) {
    logControllerError('buscar_minhas_mensagens_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Buscar avaliação do usuário atual
export const buscarMinhaAvaliacao = async (req, res) => {
  try {
    const { user } = req;

    const avaliacao = await prisma.avaliacaoPlataforma.findFirst({
      where: { ClienteID: user.id }
    });

    res.json({
      success: true,
      avaliacao
    });
  } catch (error) {
    logControllerError('buscar_minha_avaliacao_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

// Listar avaliações para exibir no site (apenas as que têm ExibirSite = true)
export const listarAvaliacoesSite = async (req, res) => {
  try {
    const avaliacoes = await prisma.avaliacaoPlataforma.findMany({
      where: {
        ExibirSite: true,
        Nota: { gte: 4 } // Apenas avaliações positivas (4-5 estrelas)
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true
          }
        }
      },
      orderBy: {
        CriadoEm: 'desc'
      },
      take: 10 // Limitar a 10 avaliações mais recentes
    });

    res.json({
      success: true,
      avaliacoes
    });
  } catch (error) {
    logControllerError('listar_avaliacoes_site_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};