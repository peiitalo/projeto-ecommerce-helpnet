const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as categorias
const listarCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: {
        Nome: 'asc'
      },
      include: {
        _count: {
          select: {
            produtos: true
          }
        }
      }
    });

    res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar categoria por ID
const buscarCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(id) },
      include: {
        produtos: {
          select: {
            ProdutoID: true,
            Nome: true,
            Preco: true,
            Ativo: true
          }
        }
      }
    });
    
    if (!categoria) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Criar nova categoria
const criarCategoria = async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }

    // Verificar se categoria já existe
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { 
        Nome: {
          equals: nome,
          mode: 'insensitive'
        }
      }
    });

    if (categoriaExistente) {
      return res.status(400).json({ erro: 'Categoria já existe' });
    }

    const categoria = await prisma.categoria.create({
      data: {
        Nome: nome
      }
    });

    res.status(201).json(categoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar categoria
const atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }

    // Verificar se categoria existe
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(id) }
    });

    if (!categoriaExistente) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    // Verificar se novo nome já existe (exceto para a categoria atual)
    const nomeExistente = await prisma.categoria.findFirst({
      where: { 
        Nome: {
          equals: nome,
          mode: 'insensitive'
        },
        CategoriaID: {
          not: parseInt(id)
        }
      }
    });

    if (nomeExistente) {
      return res.status(400).json({ erro: 'Nome da categoria já existe' });
    }

    const categoria = await prisma.categoria.update({
      where: { CategoriaID: parseInt(id) },
      data: {
        Nome: nome
      }
    });

    res.json(categoria);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir categoria
const excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se categoria existe
    const categoria = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(id) }
    });

    if (!categoria) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    // Verificar se categoria tem produtos associados
    const temProdutos = await prisma.produto.findFirst({
      where: { CategoriaID: parseInt(id) }
    });

    if (temProdutos) {
      return res.status(400).json({ 
        erro: 'Não é possível excluir categoria que possui produtos associados' 
      });
    }

    await prisma.categoria.delete({
      where: { CategoriaID: parseInt(id) }
    });

    res.json({ mensagem: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria
};