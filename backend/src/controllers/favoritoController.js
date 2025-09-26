// backend/src/controllers/favoritoController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';

export const listar = async (req, res) => {
  try {
    const userId = req.user?.id;
    const favoritos = await prisma.favorito.findMany({
      where: { ClienteID: userId },
      include: {
        produto: {
          select: {
            ProdutoID: true,
            Nome: true,
            Preco: true,
            Imagens: true,
            SKU: true,
            Ativo: true,
          }
        }
      }
    });
    res.json({ favoritos });
  } catch (error) {
    logControllerError('listar_favoritos_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const adicionar = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoId } = req.body || {};
    if (!produtoId) return res.status(400).json({ erro: 'produtoId é obrigatório' });

    // Verifica existência do produto
    const produto = await prisma.produto.findUnique({ where: { ProdutoID: parseInt(produtoId) } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const favorito = await prisma.favorito.upsert({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } },
      update: {},
      create: { ClienteID: userId, ProdutoID: parseInt(produtoId) },
    });

    res.status(201).json({ favorito });
  } catch (error) {
    logControllerError('adicionar_favorito_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

export const remover = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoId } = req.params;
    if (!produtoId) return res.status(400).json({ erro: 'produtoId é obrigatório' });

    await prisma.favorito.delete({
      where: { ClienteID_ProdutoID: { ClienteID: userId, ProdutoID: parseInt(produtoId) } }
    }).catch(() => null);

    res.json({ mensagem: 'Removido dos favoritos' });
  } catch (error) {
    logControllerError('remover_favorito_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};