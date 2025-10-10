// backend/src/controllers/produtoController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import { sendVendorLowStockEmail } from "../services/emailService.js";

/**
 * Lista produtos com filtros opcionais de categoria, status e busca.
 * Suporta paginação e retorna apenas campos necessários para performance.
 * @param {Object} req - Requisição Express
 * @param {Object} req.query - Query parameters: categoria, status, busca, pagina, limit
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com produtos e total
 */
export const listarProdutos = async (req, res) => {
  try {
    console.log('Debug listarProdutos: query:', req.query);
    const { categoria, status, busca, pagina = 1, limit = 10, precoMin, precoMax, estoqueMin, estoqueMax } = req.query;
    const skip = (pagina - 1) * limit;

    const where = {};

    // Handle category filtering - support both ID and name
    if (categoria) {
      const categoriaNum = parseInt(categoria);
      if (!isNaN(categoriaNum)) {
        // If it's a valid number, treat as ID
        where.CategoriaID = categoriaNum;
      } else {
        // If it's not a number, treat as category name and find the ID
        const categoriaEncontrada = await prisma.categoria.findFirst({
          where: { Nome: { equals: categoria, mode: 'insensitive' } },
          select: { CategoriaID: true }
        });
        if (categoriaEncontrada) {
          where.CategoriaID = categoriaEncontrada.CategoriaID;
        } else {
          // If category not found, return empty results
          logger.warn('categoria_nao_encontrada_para_filtro', { categoria });
          return res.json({ produtos: [], total: 0 });
        }
      }
    }

    if (status === "ativo") where.Ativo = true;
    else if (status === "inativo") where.Ativo = false;
    else if (status === "sem-estoque") where.Estoque = 0;

    if (busca) {
      // Uso correto de OR no Prisma para busca por nome/SKU (case-insensitive)
      where.OR = [
        { Nome: { contains: busca, mode: "insensitive" } },
        { SKU: { contains: busca, mode: "insensitive" } },
      ];
    }

    // Price filters
    if (precoMin !== undefined) {
      where.Preco = { ...where.Preco, gte: parseFloat(precoMin) };
    }
    if (precoMax !== undefined) {
      where.Preco = { ...where.Preco, lte: parseFloat(precoMax) };
    }

    // Stock filters
    if (estoqueMin !== undefined) {
      where.Estoque = { ...where.Estoque, gte: parseInt(estoqueMin) };
    }
    if (estoqueMax !== undefined) {
      where.Estoque = { ...where.Estoque, lte: parseInt(estoqueMax) };
    }

    console.log('Debug listarProdutos: where clause:', JSON.stringify(where));
    const [produtos, total] = await prisma.$transaction([
      prisma.produto.findMany({
        where,
        // Seleciona apenas campos necessários para reduzir payload
        select: {
          ProdutoID: true,
          Nome: true,
          Descricao: true,
          Preco: true,
          PrecoOriginal: true,
          Estoque: true,
          Imagens: true,
          FreteGratis: true,
          Desconto: true,
          categoria: { select: { Nome: true } },
          vendedor: { select: { VendedorID: true, Nome: true } },
          empresa: { select: { EmpresaID: true, Nome: true } },
          criadoEm: true,
        },
        orderBy: { criadoEm: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.produto.count({ where }),
    ]);

    logger.info('listar_produtos_ok', { total, filtros: req.query });
    // Cache curto para melhorar TTFB em listagens
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    res.json({ produtos, total });
  } catch (error) {
    logControllerError('listar_produtos_error', error, req);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
};

export const buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const produto = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) },
      select: {
        ProdutoID: true,
        Nome: true,
        Descricao: true,
        BreveDescricao: true,
        Preco: true,
        PrecoOriginal: true,
        Estoque: true,
        CodBarras: true,
        SKU: true,
        Peso: true,
        Dimensoes: true,
        Marca: true,
        Modelo: true,
        Cor: true,
        Garantia: true,
        Origem: true,
        Condicao: true,
        FreteGratis: true,
        Desconto: true,
        PrazoEntrega: true,
        Imagens: true,
        Ativo: true,
        criadoEm: true,
        categoria: {
          select: {
            CategoriaID: true,
            Nome: true
          }
        },
        empresa: {
          select: {
            EmpresaID: true,
            Nome: true
          }
        },
        vendedor: {
          select: {
            VendedorID: true,
            Nome: true,
            Email: true
          }
        }
      },
    });

    if (!produto) {
      logger.warn('produto_nao_encontrado', { id });
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    logger.info('buscar_produto_ok', { id });
    res.json(produto);
  } catch (error) {
    logControllerError('buscar_produto_error', error, req);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

export const criarProduto = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      breveDescricao,
      preco,
      precoOriginal,
      estoque,
      categoriaId,
      vendedorId,
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
      ativo,
    } = req.body;

    if (!nome || !preco || !categoriaId || !sku)
      return res
        .status(400)
        .json({ erro: "Campos obrigatórios: nome, preco, categoriaId, sku" });

    const skuExistente = await prisma.produto.findUnique({
      where: { SKU: sku },
    });
    if (skuExistente) return res.status(400).json({ erro: "SKU já existe" });

    if (codBarras) {
      const codigoExistente = await prisma.produto.findUnique({
        where: { CodBarras: codBarras },
      });
      if (codigoExistente)
        return res.status(400).json({ erro: "Código de barras já existe" });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { CategoriaID: parseInt(categoriaId) },
    });
    if (!categoria)
      return res.status(400).json({ erro: "Categoria não encontrada" });

    if (vendedorId) {
      const vendedor = await prisma.vendedor.findUnique({
        where: { VendedorID: parseInt(vendedorId) },
      });
      if (!vendedor)
        return res.status(400).json({ erro: "Vendedor não encontrado" });
    }

    const estoqueValue = parseInt(estoque) || 0;
    const produto = await prisma.produto.create({
      data: {
        Nome: nome,
        Descricao: descricao,
        BreveDescricao: breveDescricao,
        Preco: parseFloat(preco),
        PrecoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
        Estoque: estoqueValue,
        CategoriaID: parseInt(categoriaId),
        VendedorID: vendedorId ? parseInt(vendedorId) : null,
        CodBarras:
          codBarras || `${Date.now()}${Math.floor(Math.random() * 1000)}`,
        SKU: sku,
        Peso: peso,
        Dimensoes: dimensoes,
        Marca: marca,
        Modelo: modelo,
        Cor: cor,
        Garantia: garantia,
        Origem: origem || "Nacional",
        Condicao: condicao || "Novo",
        FreteGratis: freteGratis || false,
        Desconto: parseInt(desconto) || 0,
        PrazoEntrega: prazoEntrega,
        Imagens: imagens || [],
        Ativo: ativo !== undefined ? ativo : (estoqueValue > 0), // Set to false if out of stock
      },
      include: { categoria: true, vendedor: { select: { VendedorID: true, Nome: true } } },
    });

    logger.info('criar_produto_ok', { id: produto.ProdutoID, sku: produto.SKU });
    res.status(201).json(produto);
  } catch (error) {
    logControllerError('criar_produto_error', error, req);

    if (error.code === "P2002")
      return res
        .status(400)
        .json({ erro: "SKU ou código de barras já existe" });
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

export const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const produtoExistente = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) },
    });
    if (!produtoExistente)
      return res.status(404).json({ erro: "Produto não encontrado" });

    if (data.sku && data.sku !== produtoExistente.SKU) {
      const skuExistente = await prisma.produto.findUnique({
        where: { SKU: data.sku },
      });
      if (skuExistente) return res.status(400).json({ erro: "SKU já existe" });
    }

    if (data.codBarras && data.codBarras !== produtoExistente.CodBarras) {
      const codigoExistente = await prisma.produto.findUnique({
        where: { CodBarras: data.codBarras },
      });
      if (codigoExistente)
        return res.status(400).json({ erro: "Código de barras já existe" });
    }

    if (data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { CategoriaID: parseInt(data.categoriaId) },
      });
      if (!categoria)
        return res.status(400).json({ erro: "Categoria não encontrada" });
    }

    if (data.vendedorId !== undefined) {
      if (data.vendedorId) {
        const vendedor = await prisma.vendedor.findUnique({
          where: { VendedorID: parseInt(data.vendedorId) },
        });
        if (!vendedor)
          return res.status(400).json({ erro: "Vendedor não encontrado" });
      }
    }

    const produto = await prisma.produto.update({
      where: { ProdutoID: parseInt(id) },
      data: {
        ...(data.nome && { Nome: data.nome }),
        ...(data.descricao !== undefined && { Descricao: data.descricao }),
        ...(data.breveDescricao !== undefined && { BreveDescricao: data.breveDescricao }),
        ...(data.preco && { Preco: parseFloat(data.preco) }),
        ...(data.precoOriginal !== undefined && {
          PrecoOriginal: data.precoOriginal
            ? parseFloat(data.precoOriginal)
            : null,
        }),
        ...(data.estoque !== undefined && { Estoque: parseInt(data.estoque) }),
        ...(data.categoriaId && { CategoriaID: parseInt(data.categoriaId) }),
        ...(data.vendedorId !== undefined && { VendedorID: data.vendedorId ? parseInt(data.vendedorId) : null }),
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
        ...(data.freteGratis !== undefined && {
          FreteGratis: data.freteGratis,
        }),
        ...(data.desconto !== undefined && {
          Desconto: parseInt(data.desconto),
        }),
        ...(data.prazoEntrega !== undefined && {
          PrazoEntrega: data.prazoEntrega,
        }),
        ...(data.imagens !== undefined && { Imagens: data.imagens }),
        ...(data.ativo !== undefined && { Ativo: data.ativo }),
      },
      include: {
        categoria: true,
        vendedor: {
          select: {
            VendedorID: true,
            Nome: true,
            Email: true
          }
        }
      },
    });

    // Handle out of stock logic: if estoque <= 0, set status to inativo and notify vendor
    if (produto.Estoque <= 0 && produto.Ativo) {
      await prisma.produto.update({
        where: { ProdutoID: parseInt(id) },
        data: { Ativo: false },
      });
      produto.Ativo = false; // Update local object for consistency

      // Send email notification to vendor
      if (produto.vendedor) {
        try {
          await sendVendorLowStockEmail({
            vendedorNome: produto.vendedor.Nome,
            email: produto.vendedor.Email,
            produtoNome: produto.Nome,
            estoqueAtual: produto.Estoque,
            vendasRecentes: 0 // For out of stock, we can set to 0 or calculate if needed
          });
          logger.info('email_estoque_esgotado_enviado', { produtoId: produto.ProdutoID, vendedorId: produto.vendedor.VendedorID });
        } catch (emailError) {
          logger.warn('erro_email_estoque_esgotado', { produtoId: produto.ProdutoID, error: emailError.message });
        }
      }
    }


    logger.info('atualizar_produto_ok', { id: produto.ProdutoID });
    res.json(produto);
  } catch (error) {
    logControllerError('atualizar_produto_error', error, req);
    if (error.code === "P2002")
      return res
        .status(400)
        .json({ erro: "SKU ou código de barras já existe" });
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

export const excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const produto = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(id) },
    });
    if (!produto)
      return res.status(404).json({ erro: "Produto não encontrado" });

    const temPedidos = await prisma.itensPedido.findFirst({
      where: { ProdutoID: parseInt(id) },
    });
    if (temPedidos) {
      await prisma.produto.update({
        where: { ProdutoID: parseInt(id) },
        data: { Ativo: false },
      });
      logger.warn('produto_desativado_tem_pedidos', { id });
      return res.json({
        mensagem: "Produto desativado (possui pedidos associados)",
      });
    }

    await prisma.produto.delete({ where: { ProdutoID: parseInt(id) } });
    logger.info('excluir_produto_ok', { id });
    res.json({ mensagem: "Produto excluído com sucesso" });
  } catch (error) {
    logControllerError('excluir_produto_error', error, req);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

export const acaoEmLote = async (req, res) => {
  try {
    const { acao, produtoIds } = req.body;
    if (!acao || !produtoIds || !Array.isArray(produtoIds))
      return res
        .status(400)
        .json({ erro: "Ação e IDs dos produtos são obrigatórios" });

    const ids = produtoIds.map((id) => parseInt(id));

    switch (acao) {
      case "ativar":
        await prisma.produto.updateMany({
          where: { ProdutoID: { in: ids } },
          data: { Ativo: true },
        });
        break;
      case "desativar":
        await prisma.produto.updateMany({
          where: { ProdutoID: { in: ids } },
          data: { Ativo: false },
        });
        break;
      case "excluir":
        const produtosComPedidos = await prisma.itensPedido.findMany({
          where: { ProdutoID: { in: ids } },
          select: { ProdutoID: true },
        });
        const idsComPedidos = produtosComPedidos.map((i) => i.ProdutoID);
        const idsSemPedidos = ids.filter((i) => !idsComPedidos.includes(i));

        if (idsComPedidos.length > 0)
          await prisma.produto.updateMany({
            where: { ProdutoID: { in: idsComPedidos } },
            data: { Ativo: false },
          });
        if (idsSemPedidos.length > 0)
          await prisma.produto.deleteMany({
            where: { ProdutoID: { in: idsSemPedidos } },
          });

        logger.info('acao_em_lote_ok', { acao, total: ids.length, desativados: idsComPedidos.length, excluidos: idsSemPedidos.length });
        return res.json({
          mensagem: `${idsSemPedidos.length} produtos excluídos, ${idsComPedidos.length} produtos desativados`,
        });
      default:
        return res.status(400).json({ erro: "Ação inválida" });
    }

    res.json({
      mensagem: `Ação '${acao}' executada com sucesso em ${ids.length} produtos`,
    });
  } catch (error) {
    logControllerError('acao_em_lote_error', error, req);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

export const gerarSKU = async (req, res) => {
  try {
    let sku,
      tentativas = 0,
      maxTentativas = 10;

    do {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      sku = `PROD-${timestamp}-${randomNum}`;

      const skuExistente = await prisma.produto.findUnique({
        where: { SKU: sku },
      });
      if (!skuExistente) break;
      tentativas++;
    } while (tentativas < maxTentativas);

    if (tentativas >= maxTentativas)
      return res.status(500).json({ erro: "Não foi possível gerar SKU único" });
    logger.info('gerar_sku_ok');
    res.json({ sku });
  } catch (error) {
    logControllerError('gerar_sku_error', error, req);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};
