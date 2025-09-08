// backend/src/routes/vendorProdutoRoutes.js
import express from 'express';
import prisma from '../config/prisma.js';
import vendorScope from '../middleware/vendorScope.js';

const router = express.Router();

// Aplica escopo do vendedor para todas as rotas abaixo
router.use(vendorScope);

// Listar produtos da empresa do vendedor
router.get('/', async (req, res) => {
  try {
    const { status, busca, categoria, pagina = 1, limit = 10 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limit);

    // Escopo por empresa + legados sem EmpresaID
    const empresaClause = { OR: [{ EmpresaID: req.vendorEmpresaId }, { EmpresaID: null }] };
    const andClauses = [empresaClause];

    if (categoria) andClauses.push({ CategoriaID: parseInt(categoria) });
    if (status === 'ativo') andClauses.push({ Ativo: true });
    else if (status === 'inativo') andClauses.push({ Ativo: false });
    else if (status === 'sem-estoque') andClauses.push({ Estoque: 0 });

    if (busca) {
      andClauses.push({
        OR: [
          { Nome: { contains: busca, mode: 'insensitive' } },
          { SKU: { contains: busca, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andClauses };

    const [produtos, total] = await prisma.$transaction([
      prisma.produto.findMany({
        where,
        include: { categoria: true },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.produto.count({ where }),
    ]);

    res.json({ produtos, total });
  } catch (error) {
    console.error('Erro ao listar produtos do vendedor:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Criar produto na empresa do vendedor
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.nome || !data.preco || !data.categoriaId || !data.sku) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, preco, categoriaId, sku' });
    }

    const skuExistente = await prisma.produto.findUnique({ where: { SKU: data.sku } });
    if (skuExistente) return res.status(400).json({ erro: 'SKU já existe' });

    if (data.codBarras) {
      const codigoExistente = await prisma.produto.findUnique({ where: { CodBarras: data.codBarras } });
      if (codigoExistente) return res.status(400).json({ erro: 'Código de barras já existe' });
    }

    const categoria = await prisma.categoria.findUnique({ where: { CategoriaID: parseInt(data.categoriaId) } });
    if (!categoria) return res.status(400).json({ erro: 'Categoria não encontrada' });

    const produto = await prisma.produto.create({
      data: {
        Nome: data.nome,
        Descricao: data.descricao,
        Preco: parseFloat(data.preco),
        PrecoOriginal: data.precoOriginal ? parseFloat(data.precoOriginal) : null,
        Estoque: parseInt(data.estoque) || 0,
        CategoriaID: parseInt(data.categoriaId),
        EmpresaID: req.vendorEmpresaId,
        CodBarras: data.codBarras || `${Date.now()}${Math.floor(Math.random() * 1000)}`,
        SKU: data.sku,
        Peso: data.peso,
        Dimensoes: data.dimensoes,
        Marca: data.marca,
        Modelo: data.modelo,
        Cor: data.cor,
        Garantia: data.garantia,
        Origem: data.origem || 'Nacional',
        Condicao: data.condicao || 'Novo',
        FreteGratis: data.freteGratis || false,
        Desconto: data.desconto ? parseInt(data.desconto) : 0,
        PrazoEntrega: data.prazoEntrega,
        Imagens: Array.isArray(data.imagens) ? data.imagens : [],
        Ativo: data.ativo !== undefined ? data.ativo : true,
      },
      include: { categoria: true },
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Atualizar produto da empresa do vendedor
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const produtoExistente = await prisma.produto.findUnique({ where: { ProdutoID: id } });
    if (!produtoExistente || ![req.vendorEmpresaId, null].includes(produtoExistente.EmpresaID)) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    if (data.sku && data.sku !== produtoExistente.SKU) {
      const skuExistente = await prisma.produto.findUnique({ where: { SKU: data.sku } });
      if (skuExistente) return res.status(400).json({ erro: 'SKU já existe' });
    }

    if (data.codBarras && data.codBarras !== produtoExistente.CodBarras) {
      const codigoExistente = await prisma.produto.findUnique({ where: { CodBarras: data.codBarras } });
      if (codigoExistente) return res.status(400).json({ erro: 'Código de barras já existe' });
    }

    if (data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({ where: { CategoriaID: parseInt(data.categoriaId) } });
      if (!categoria) return res.status(400).json({ erro: 'Categoria não encontrada' });
    }

    const claimEmpresa = produtoExistente.EmpresaID == null;
    const updateData = {
      ...(data.nome && { Nome: data.nome }),
      ...(data.descricao !== undefined && { Descricao: data.descricao }),
      ...(data.preco && { Preco: parseFloat(data.preco) }),
      ...(data.precoOriginal !== undefined && { PrecoOriginal: data.precoOriginal ? parseFloat(data.precoOriginal) : null }),
      ...(data.estoque !== undefined && { Estoque: parseInt(data.estoque) }),
      ...(data.categoriaId && { CategoriaID: parseInt(data.categoriaId) }),
      ...(data.codBarras && { CodBarras: data.codBarras }),
      ...(data.sku && { SKU: data.sku }),
      ...(data.peso !== undefined && { Peso: data.peso }),
      ...(data.dimensoes !== undefined && { Dimensoes: data.dimensoes }),
      ...(data.marca !== undefined && { Marca: data.marca }),
      ...(data.modelo !== undefined && { Modelo: data.modelo }),
      ...(data.cor !== undefined && { Cor: data.cor }),
      ...(data.garantia !== undefined && { Garantia: data.garantia }),
      ...(data.origem !== undefined && { Origem: data.origem }),
      ...(data.condicao !== undefined && { Condicao: data.condicao }),
      ...(data.freteGratis !== undefined && { FreteGratis: data.freteGratis }),
      ...(data.desconto !== undefined && { Desconto: parseInt(data.desconto) }),
      ...(data.prazoEntrega !== undefined && { PrazoEntrega: data.prazoEntrega }),
      ...(data.imagens !== undefined && { Imagens: data.imagens }),
      ...(data.ativo !== undefined && { Ativo: data.ativo }),
      ...(claimEmpresa ? { EmpresaID: req.vendorEmpresaId } : {}),
    };

    const produto = await prisma.produto.update({
      where: { ProdutoID: id },
      data: updateData,
      include: { categoria: true },
    });

    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Excluir/desativar produto da empresa do vendedor
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const produto = await prisma.produto.findUnique({ where: { ProdutoID: id } });
    if (!produto || ![req.vendorEmpresaId, null].includes(produto.EmpresaID)) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const temPedidos = await prisma.itensPedido.findFirst({ where: { ProdutoID: id } });
    if (temPedidos) {
      await prisma.produto.update({ where: { ProdutoID: id }, data: { Ativo: false } });
      return res.json({ mensagem: 'Produto desativado (possui pedidos associados)' });
    }

    await prisma.produto.delete({ where: { ProdutoID: id } });
    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

export default router;
