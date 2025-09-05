const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos os produtos
const listarProdutos = async (req, res) => {
  try {
    const { categoria, status, busca, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    // Filtro por categoria
    if (categoria) {
      where.CategoriaID = parseInt(categoria);
    }
    
    // Filtro por status
    if (status === 'ativo') {
      where.Ativo = true;
    } else if (status === 'inativo') {
      where.Ativo = false;
    } else if (status === 'sem-estoque') {
      where.Estoque = 0;
    }
    
    // Filtro por busca (nome ou SKU)
    if (busca) {
      where.OR = [
        { Nome: { contains: busca, mode: 'insensitive' } },
        { SKU: { contains: busca, mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: true
        },
        orderBy: {
          CriadoEm: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.produto.count({ where })
    ]);
    
    res.json({
      produtos,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar produto por ID
const buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const produto = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) },
      include: {
        categoria: true
      }
    });
    
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Criar novo produto
const criarProduto = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      preco,
      precoOriginal,
      estoque,
      categoriaId,
      codBarras,
      sku,
      peso,
      dimensoes,
      marca,
      modelo,
      cor,
      garantia,
      origem,
      condicao,
      freteGratis,
      desconto,
      prazoEntrega,
      imagens,
      ativo
    } = req.body;

    // Validações básicas
    if (!nome || !preco || !categoriaId || !sku) {
      return res.status(400).json({ 
        erro: 'Campos obrigatórios: nome, preco, categoriaId, sku' 
      });
    }

    // Verificar se SKU já existe
    const skuExistente = await prisma.produto.findUnique({
      where: { SKU: sku }
    });

    if (skuExistente) {
      return res.status(400).json({ erro: 'SKU já existe' });
    }

    // Verificar se código de barras já existe (se fornecido)
    if (codBarras) {
      const codigoExistente = await prisma.produto.findUnique({
        where: { CodBarras: codBarras }
      });

      if (codigoExistente) {
        return res.status(400).json({ erro: 'Código de barras já existe' });
      }
    }

    // Verificar se categoria existe
    const categoria = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(categoriaId) }
    });

    if (!categoria) {
      return res.status(400).json({ erro: 'Categoria não encontrada' });
    }

    const produto = await prisma.produto.create({
      data: {
        Nome: nome,
        Descricao: descricao,
        Preco: parseFloat(preco),
        PrecoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
        Estoque: parseInt(estoque) || 0,
        CategoriaID: parseInt(categoriaId),
        CodBarras: codBarras || `${Date.now()}${Math.floor(Math.random() * 1000)}`,
        SKU: sku,
        Peso: peso,
        Dimensoes: dimensoes,
        Marca: marca,
        Modelo: modelo,
        Cor: cor,
        Garantia: garantia,
        Origem: origem || 'Nacional',
        Condicao: condicao || 'Novo',
        FreteGratis: freteGratis || false,
        Desconto: parseInt(desconto) || 0,
        PrazoEntrega: prazoEntrega,
        Imagens: imagens || [],
        Ativo: ativo !== undefined ? ativo : true
      },
      include: {
        categoria: true
      }
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'SKU ou código de barras já existe' });
    }
    
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar produto
const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      preco,
      precoOriginal,
      estoque,
      categoriaId,
      codBarras,
      sku,
      peso,
      dimensoes,
      marca,
      modelo,
      cor,
      garantia,
      origem,
      condicao,
      freteGratis,
      desconto,
      prazoEntrega,
      imagens,
      ativo
    } = req.body;

    // Verificar se produto existe
    const produtoExistente = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) }
    });

    if (!produtoExistente) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    // Verificar se SKU já existe (exceto para o produto atual)
    if (sku && sku !== produtoExistente.SKU) {
      const skuExistente = await prisma.produto.findUnique({
        where: { SKU: sku }
      });

      if (skuExistente) {
        return res.status(400).json({ erro: 'SKU já existe' });
      }
    }

    // Verificar se código de barras já existe (exceto para o produto atual)
    if (codBarras && codBarras !== produtoExistente.CodBarras) {
      const codigoExistente = await prisma.produto.findUnique({
        where: { CodBarras: codBarras }
      });

      if (codigoExistente) {
        return res.status(400).json({ erro: 'Código de barras já existe' });
      }
    }

    // Verificar se categoria existe
    if (categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { CategoriaID: parseInt(categoriaId) }
      });

      if (!categoria) {
        return res.status(400).json({ erro: 'Categoria não encontrada' });
      }
    }

    const produto = await prisma.produto.update({
      where: { ProdutoID: parseInt(id) },
      data: {
        ...(nome && { Nome: nome }),
        ...(descricao !== undefined && { Descricao: descricao }),
        ...(preco && { Preco: parseFloat(preco) }),
        ...(precoOriginal !== undefined && { PrecoOriginal: precoOriginal ? parseFloat(precoOriginal) : null }),
        ...(estoque !== undefined && { Estoque: parseInt(estoque) }),
        ...(categoriaId && { CategoriaID: parseInt(categoriaId) }),
        ...(codBarras && { CodBarras: codBarras }),
        ...(sku && { SKU: sku }),
        ...(peso !== undefined && { Peso: peso }),
        ...(dimensoes !== undefined && { Dimensoes: dimensoes }),
        ...(marca !== undefined && { Marca: marca }),
        ...(modelo !== undefined && { Modelo: modelo }),
        ...(cor !== undefined && { Cor: cor }),
        ...(garantia !== undefined && { Garantia: garantia }),
        ...(origem !== undefined && { Origem: origem }),
        ...(condicao !== undefined && { Condicao: condicao }),
        ...(freteGratis !== undefined && { FreteGratis: freteGratis }),
        ...(desconto !== undefined && { Desconto: parseInt(desconto) }),
        ...(prazoEntrega !== undefined && { PrazoEntrega: prazoEntrega }),
        ...(imagens !== undefined && { Imagens: imagens }),
        ...(ativo !== undefined && { Ativo: ativo })
      },
      include: {
        categoria: true
      }
    });

    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'SKU ou código de barras já existe' });
    }
    
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir produto
const excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const produto = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) }
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    // Verificar se produto tem pedidos associados
    const temPedidos = await prisma.itensPedido.findFirst({
      where: { ProdutoID: parseInt(id) }
    });

    if (temPedidos) {
      // Se tem pedidos, apenas desativar
      await prisma.produto.update({
        where: { ProdutoID: parseInt(id) },
        data: { Ativo: false }
      });
      
      return res.json({ 
        mensagem: 'Produto desativado (não pode ser excluído pois possui pedidos associados)' 
      });
    }

    // Se não tem pedidos, pode excluir
    await prisma.produto.delete({
      where: { ProdutoID: parseInt(id) }
    });

    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Ações em lote
const acaoEmLote = async (req, res) => {
  try {
    const { acao, produtoIds } = req.body;

    if (!acao || !produtoIds || !Array.isArray(produtoIds)) {
      return res.status(400).json({ erro: 'Ação e IDs dos produtos são obrigatórios' });
    }

    const ids = produtoIds.map(id => parseInt(id));

    switch (acao) {
      case 'ativar':
        await prisma.produto.updateMany({
          where: { ProdutoID: { in: ids } },
          data: { Ativo: true }
        });
        break;

      case 'desativar':
        await prisma.produto.updateMany({
          where: { ProdutoID: { in: ids } },
          data: { Ativo: false }
        });
        break;

      case 'excluir':
        // Verificar se algum produto tem pedidos
        const produtosComPedidos = await prisma.itensPedido.findMany({
          where: { ProdutoID: { in: ids } },
          select: { ProdutoID: true }
        });

        const idsComPedidos = produtosComPedidos.map(item => item.ProdutoID);
        const idsSemPedidos = ids.filter(id => !idsComPedidos.includes(id));

        // Desativar produtos com pedidos
        if (idsComPedidos.length > 0) {
          await prisma.produto.updateMany({
            where: { ProdutoID: { in: idsComPedidos } },
            data: { Ativo: false }
          });
        }

        // Excluir produtos sem pedidos
        if (idsSemPedidos.length > 0) {
          await prisma.produto.deleteMany({
            where: { ProdutoID: { in: idsSemPedidos } }
          });
        }

        return res.json({
          mensagem: `${idsSemPedidos.length} produtos excluídos, ${idsComPedidos.length} produtos desativados`
        });

      default:
        return res.status(400).json({ erro: 'Ação inválida' });
    }

    res.json({ mensagem: `Ação '${acao}' executada com sucesso em ${ids.length} produtos` });
  } catch (error) {
    console.error('Erro na ação em lote:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Gerar SKU único
const gerarSKU = async (req, res) => {
  try {
    let sku;
    let tentativas = 0;
    const maxTentativas = 10;

    do {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      sku = `PROD-${timestamp}-${randomNum}`;
      
      const skuExistente = await prisma.produto.findUnique({
        where: { SKU: sku }
      });

      if (!skuExistente) {
        break;
      }

      tentativas++;
    } while (tentativas < maxTentativas);

    if (tentativas >= maxTentativas) {
      return res.status(500).json({ erro: 'Não foi possível gerar SKU único' });
    }

    res.json({ sku });
  } catch (error) {
    console.error('Erro ao gerar SKU:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  acaoEmLote,
  gerarSKU
};