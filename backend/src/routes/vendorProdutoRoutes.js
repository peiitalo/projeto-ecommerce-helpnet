// backend/src/routes/vendorProdutoRoutes.js
import express from 'express';
import prisma from '../config/prisma.js';
import vendorScope from '../middleware/vendorScope.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Autenticação + escopo de vendedor em todas as rotas
router.use(authMiddleware);
router.use(vendorScope);

// Listar produtos do vendedor logado
router.get('/', async (req, res) => {
  try {
    console.log('Debug: vendorId:', req.vendorId, 'vendorEmpresaId:', req.vendorEmpresaId, 'query:', req.query);
    const { status, busca, categoria, pagina = 1, limit = 10 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limit);

    // Escopo estrito por vendedor individual para isolamento de dados
    const vendedorClause = { VendedorID: req.vendorId };
    const andClauses = [vendedorClause];

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
    console.log('Debug: where clause:', JSON.stringify(where));

    const [produtos, total] = await prisma.$transaction([
      prisma.produto.findMany({
        where,
        select: {
          ProdutoID: true,
          Nome: true,
          Preco: true,
          Estoque: true,
          SKU: true,
          Imagens: true,
          Ativo: true,
          criadoEm: true,
          categoria: { select: { Nome: true } },
          vendedor: { select: { VendedorID: true, Nome: true } },
          empresa: { select: { EmpresaID: true, Nome: true } }
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.produto.count({ where }),
    ]);

    res.json({ produtos, total });
  } catch (error) {
    console.error('Erro ao listar produtos do vendedor:', error);
    console.error('Debug: Detailed error:', error.message, error.stack);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Criar produto do vendedor logado
router.post('/', async (req, res) => {
  try {
    console.log('Debug POST /: vendorId:', req.vendorId, 'vendorEmpresaId:', req.vendorEmpresaId, 'body keys:', Object.keys(req.body));
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
        EmpresaID: req.vendorEmpresaId, // Mantém EmpresaID para compatibilidade
        VendedorID: req.vendorId, // Define VendedorID para isolamento individual
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
      include: { categoria: true, vendedor: { select: { VendedorID: true, Nome: true } }, empresa: { select: { EmpresaID: true, Nome: true } } },
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Atualizar produto do vendedor logado
router.put('/:id', async (req, res) => {
  try {
    console.log('Debug PUT /:id vendorId:', req.vendorId, 'vendorEmpresaId:', req.vendorEmpresaId, 'id:', req.params.id, 'body keys:', Object.keys(req.body));
    const id = parseInt(req.params.id);
    const data = req.body;

    const produtoExistente = await prisma.produto.findUnique({ where: { ProdutoID: id } });
    // Verifica se o produto pertence ao vendedor logado para isolamento de dados
    if (!produtoExistente || produtoExistente.VendedorID !== req.vendorId) {
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
      include: { categoria: true, vendedor: { select: { VendedorID: true, Nome: true } }, empresa: { select: { EmpresaID: true, Nome: true } } },
    });

    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Ação em lote para produtos do vendedor logado
router.post('/acao-em-lote', async (req, res) => {
  try {
    console.log('Debug POST /acao-em-lote: vendorId:', req.vendorId, 'vendorEmpresaId:', req.vendorEmpresaId, 'acao:', req.body.acao, 'produtoIds length:', req.body.produtoIds?.length);
    const { acao, produtoIds } = req.body;
    if (!acao || !produtoIds || !Array.isArray(produtoIds)) {
      return res.status(400).json({ erro: 'Ação e IDs dos produtos são obrigatórios' });
    }

    const ids = produtoIds.map(id => parseInt(id));

    // Verificar se todos os produtos pertencem ao vendedor logado para isolamento de dados
    const produtos = await prisma.produto.findMany({
      where: { ProdutoID: { in: ids } },
      select: { ProdutoID: true, VendedorID: true }
    });

    const produtosInvalidos = produtos.filter(p => p.VendedorID !== req.vendorId);
    if (produtosInvalidos.length > 0) {
      return res.status(403).json({ erro: 'Alguns produtos não pertencem ao seu usuário' });
    }

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
        const produtosComPedidos = await prisma.itensPedido.findMany({
          where: { ProdutoID: { in: ids } },
          select: { ProdutoID: true }
        });
        const idsComPedidos = produtosComPedidos.map(i => i.ProdutoID);
        const idsSemPedidos = ids.filter(i => !idsComPedidos.includes(i));

        if (idsComPedidos.length > 0) {
          await prisma.produto.updateMany({
            where: { ProdutoID: { in: idsComPedidos } },
            data: { Ativo: false }
          });
        }
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
    console.error('Erro na ação em lote (vendedor):', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Excluir/desativar produto do vendedor logado
router.delete('/:id', async (req, res) => {
  try {
    console.log('Debug DELETE /:id vendorId:', req.vendorId, 'vendorEmpresaId:', req.vendorEmpresaId, 'id:', req.params.id);
    const id = parseInt(req.params.id);

    const produto = await prisma.produto.findUnique({ where: { ProdutoID: id } });
    // Verifica se o produto pertence ao vendedor logado para isolamento de dados
    if (!produto || produto.VendedorID !== req.vendorId) {
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
