// backend/src/controllers/categoriaController.js
import prisma from "../config/prisma.js"; 
import { logControllerError, logger } from "../utils/logger.js";

// Listar todas as categorias
export const listarCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { Nome: 'asc' },
      include: { 
        _count: { select: { produtos: true } } 
      }
    });
    logger.info('listar_categorias_ok', { total: categorias.length });
    res.json(categorias);
  } catch (error) {
    logControllerError('listar_categorias_error', error, req, { query: req.query });
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar categoria por ID
export const buscarCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(id) },
      include: {
        produtos: {
          select: { ProdutoID: true, Nome: true, Preco: true, Ativo: true }
        }
      }
    });
    if (!categoria) {
      logger.warn('categoria_nao_encontrada', { id });
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }
    logger.info('buscar_categoria_ok', { id });
    res.json(categoria);
  } catch (error) {
    logControllerError('buscar_categoria_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Criar nova categoria
export const criarCategoria = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });

    const categoriaExistente = await prisma.categoria.findFirst({
      where: { Nome: { equals: nome, mode: 'insensitive' } }
    });
    if (categoriaExistente) return res.status(400).json({ erro: 'Categoria já existe' });

    const categoria = await prisma.categoria.create({ data: { Nome: nome } });
    logger.info('criar_categoria_ok', { id: categoria.CategoriaID });
    res.status(201).json(categoria);
  } catch (error) {
    logControllerError('criar_categoria_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar categoria
export const atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });

    const categoriaExistente = await prisma.categoria.findUnique({ where: { CategoriaID: parseInt(id) } });
    if (!categoriaExistente) return res.status(404).json({ erro: 'Categoria não encontrada' });

    const nomeExistente = await prisma.categoria.findFirst({
      where: { 
        Nome: { equals: nome, mode: 'insensitive' },
        CategoriaID: { not: parseInt(id) }
      }
    });
    if (nomeExistente) return res.status(400).json({ erro: 'Nome da categoria já existe' });

    const categoria = await prisma.categoria.update({
      where: { CategoriaID: parseInt(id) },
      data: { Nome: nome }
    });
    logger.info('atualizar_categoria_ok', { id: categoria.CategoriaID });
    res.json(categoria);
  } catch (error) {
    logControllerError('atualizar_categoria_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir categoria
export const excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await prisma.categoria.findUnique({ where: { CategoriaID: parseInt(id) } });
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });

    const temProdutos = await prisma.produto.findFirst({ where: { CategoriaID: parseInt(id) } });
    if (temProdutos) return res.status(400).json({ erro: 'Não é possível excluir categoria que possui produtos associados' });

    await prisma.categoria.delete({ where: { CategoriaID: parseInt(id) } });
    logger.info('excluir_categoria_ok', { id: parseInt(id) });
    res.json({ mensagem: 'Categoria excluída com sucesso' });
  } catch (error) {
    logControllerError('excluir_categoria_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
