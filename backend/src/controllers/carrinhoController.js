// backend/src/controllers/carrinhoController.js
import prisma from '../config/prisma.js';
import { logControllerError, logger } from '../utils/logger.js';

export const listar = async (req, res) => {
  try {
    const userId = req.user?.id;
    logger.info('listar carrinho called', { userId });
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const items = await prisma.carrinhoItem.findMany({
      where: { ClienteID: userId },
      include: { produto: { select: { ProdutoID: true, Nome: true, Preco: true, Imagens: true, SKU: true, Ativo: true } } },
      orderBy: { AdicionadoEm: 'desc' }
    });
    logger.info('listar carrinho success', { userId, itemCount: items.length });
    res.json({ itens: items });
  } catch (error) {
    logControllerError('listar_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const adicionar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const { produtoId, quantidade } = req.body || {};
    if (!produtoId) return res.status(400).json({ erro: 'produtoId é obrigatório' });
    const qtd = Math.max(1, parseInt(quantidade || 1));
    logger.info('adicionar carrinho called', { userId, produtoId, quantidade: qtd });

    const produto = await prisma.produto.findUnique({ where: { ProdutoID: parseInt(produtoId) } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const item = await prisma.carrinhoItem.upsert({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      update: { Quantidade: { increment: qtd } },
      create: { ClienteID: userId, ProdutoID: parseInt(produtoId), Quantidade: qtd },
      include: { produto: true }
    });

    logger.info('adicionar carrinho success', { userId, produtoId, itemId: item.CarrinhoItemID, quantidade: item.Quantidade });
    res.status(201).json({ item });
  } catch (error) {
    logControllerError('adicionar_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const atualizar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const { produtoId } = req.params;
    const { quantidade } = req.body || {};
    const qtd = parseInt(quantidade);
    if (!Number.isInteger(qtd) || qtd < 1) return res.status(400).json({ erro: 'quantidade deve ser inteiro >= 1' });
    logger.info('atualizar carrinho called', { userId, produtoId, quantidade: qtd });

    const item = await prisma.carrinhoItem.update({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      data: { Quantidade: qtd },
      include: { produto: true }
    }).catch(() => null);

    if (!item) return res.status(404).json({ erro: 'Item não encontrado no carrinho' });
    logger.info('atualizar carrinho success', { userId, produtoId, itemId: item.CarrinhoItemID, quantidade: item.Quantidade });
    res.json({ item });
  } catch (error) {
    logControllerError('atualizar_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const remover = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const { produtoId } = req.params;
    logger.info('remover carrinho called', { userId, produtoId });
    await prisma.carrinhoItem.delete({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } }
    }).catch(() => null);
    logger.info('remover carrinho success', { userId, produtoId });
    res.json({ mensagem: 'Item removido do carrinho' });
  } catch (error) {
    logControllerError('remover_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const limpar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    logger.info('limpar carrinho called', { userId });
    await prisma.carrinhoItem.deleteMany({ where: { ClienteID: userId } });
    logger.info('limpar carrinho success', { userId });
    res.json({ mensagem: 'Carrinho limpo' });
  } catch (error) {
    logControllerError('limpar_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};