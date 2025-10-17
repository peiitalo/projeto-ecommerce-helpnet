// backend/src/controllers/avaliacaoController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';
import { enviarNotificacaoAvaliacao } from '../services/emailService.js';

export const listarPorProduto = async (req, res) => {
  try {
    const { produtoId } = req.params;
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { ProdutoID: parseInt(produtoId) },
      orderBy: { CriadoEm: 'desc' },
      include: {
        cliente: {
          select: {
            Nome: true
          }
        }
      }
    });
    res.json({ data: avaliacoes });
  } catch (error) {
    logControllerError('listar_avaliacoes_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const minhaDoProduto = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoId } = req.params;
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } }
    });
    res.json({ data: avaliacao });
  } catch (error) {
    logControllerError('minha_avaliacao_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const avaliar = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoId } = req.params;
    const { nota, comentario } = req.body || {};
    const notaInt = parseInt(nota);
    if (!Number.isInteger(notaInt) || notaInt < 1 || notaInt > 5) {
      return res.status(400).json({ erro: 'nota deve ser um inteiro de 1 a 5' });
    }

    const produto = await prisma.produto.findUnique({ 
      where: { ProdutoID: parseInt(produtoId) },
      include: {
        vendedor: {
          select: {
            Nome: true,
            Email: true
          }
        }
      }
    });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const avaliacao = await prisma.avaliacao.upsert({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      update: { Nota: notaInt, Comentario: comentario ?? null },
      create: { ClienteID: userId, ProdutoID: parseInt(produtoId), Nota: notaInt, Comentario: comentario ?? null },
    });

    // Enviar notificação por email para o vendedor
    try {
      const cliente = await prisma.cliente.findUnique({ 
        where: { ClienteID: userId },
        select: { Nome: true }
      });
      
      if (produto.vendedor && produto.vendedor.Email) {
        await enviarNotificacaoAvaliacao(
          produto.vendedor.Email,
          produto.vendedor.Nome,
          produto.Nome,
          cliente?.Nome || 'Cliente',
          notaInt,
          comentario
        );
      }
    } catch (emailError) {
      console.error('Erro ao enviar notificação de avaliação:', emailError);
      // Não falhar a operação por causa do email
    }

    res.status(201).json({ data: avaliacao });
  } catch (error) {
    logControllerError('avaliar_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const remover = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoId } = req.params;
    await prisma.avaliacao.delete({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } }
    }).catch(() => null);
    res.json({ mensagem: 'Avaliação removida' });
  } catch (error) {
    logControllerError('remover_avaliacao_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};