// backend/src/controllers/carrinhoController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';

export const listar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const items = await prisma.carrinhoItem.findMany({
      where: { ClienteID: userId },
      include: { produto: { select: { ProdutoID: true, Nome: true, Preco: true, Imagens: true, SKU: true, Ativo: true } } },
      orderBy: { AdicionadoEm: 'desc' }
    });
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

    const produto = await prisma.produto.findUnique({ where: { ProdutoID: parseInt(produtoId) } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const item = await prisma.carrinhoItem.upsert({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      update: { Quantidade: { increment: qtd } },
      create: { ClienteID: userId, ProdutoID: parseInt(produtoId), Quantidade: qtd },
      include: { produto: true }
    });

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

    const item = await prisma.carrinhoItem.update({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      data: { Quantidade: qtd },
      include: { produto: true }
    }).catch(() => null);

    if (!item) return res.status(404).json({ erro: 'Item não encontrado no carrinho' });
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
    await prisma.carrinhoItem.delete({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } }
    }).catch(() => null);
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

    await prisma.carrinhoItem.deleteMany({ where: { ClienteID: userId } });
    res.json({ mensagem: 'Carrinho limpo' });
  } catch (error) {
    logControllerError('limpar_carrinho_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};