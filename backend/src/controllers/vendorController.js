// backend/src/controllers/vendorController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';

export const dashboard = async (req, res) => {
  try {
    const { user } = req;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({ error: "Acesso negado. Apenas vendedores podem acessar esta funcionalidade." });
    }

    // Usar o vendedorId do JWT payload
    const vendedorId = user.vendedorId;
    if (!vendedorId) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Métricas do vendedor
    const [productsCount, activeProductsCount, ordersCount, revenue, clientsCount] = await Promise.all([
      // Total de produtos do vendedor
      prisma.produto.count({ where: { VendedorID: vendedorId } }),

      // Produtos ativos
      prisma.produto.count({ where: { VendedorID: vendedorId, Ativo: true } }),

      // Total de pedidos (onde há produtos do vendedor)
      prisma.pedido.count({
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          }
        }
      }),

      // Receita total
      prisma.pedido.aggregate({
        _sum: { Total: true },
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          },
          Status: 'Pago' // Apenas pedidos pagos
        }
      }),

      // Número de clientes únicos
      prisma.pedido.findMany({
        select: { ClienteID: true },
        distinct: ['ClienteID'],
        where: {
          itensPedido: {
            some: {
              produto: { VendedorID: vendedorId }
            }
          }
        }
      }).then(results => results.length)
    ]);

    res.json({
      produtos: {
        total: productsCount,
        ativos: activeProductsCount
      },
      pedidos: ordersCount,
      receita: revenue._sum.Total || 0,
      clientes: clientsCount
    });
  } catch (error) {
    logControllerError('vendor_dashboard_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar endereços do vendedor
export const listarEnderecos = async (req, res) => {
  try {
    const { user } = req;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    const enderecos = await prisma.enderecoVendedor.findMany({
      where: { VendedorID: user.vendedorId },
      orderBy: { Nome: 'asc' }
    });

    res.json({ enderecos });
  } catch (error) {
    logControllerError('vendor_listar_enderecos_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo endereço para o vendedor
export const criarEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { Nome, Complemento, CEP, Cidade, UF, TipoEndereco, Numero, Bairro } = req.body;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Validações
    if (!Nome || !CEP || !Cidade || !UF || !Numero || !Bairro) {
      return res.status(400).json({
        errors: ["Nome, CEP, Cidade, UF, Número e Bairro são obrigatórios"]
      });
    }

    // Verificar se já existe um endereço com o mesmo nome para este vendedor
    const enderecoExistente = await prisma.enderecoVendedor.findFirst({
      where: {
        VendedorID: user.vendedorId,
        Nome: Nome
      }
    });

    if (enderecoExistente) {
      return res.status(400).json({
        errors: ["Já existe um endereço com este nome"]
      });
    }

    const endereco = await prisma.enderecoVendedor.create({
      data: {
        VendedorID: user.vendedorId,
        Nome,
        Complemento: Complemento || null,
        CEP,
        Cidade,
        UF,
        TipoEndereco: TipoEndereco || 'Comercial',
        Numero,
        Bairro
      }
    });

    res.status(201).json({ endereco });
  } catch (error) {
    logControllerError('vendor_criar_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar endereço do vendedor
export const atualizarEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { enderecoId } = req.params;
    const { Nome, Complemento, CEP, Cidade, UF, TipoEndereco, Numero, Bairro } = req.body;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Verificar se o endereço existe e pertence ao vendedor
    const enderecoExistente = await prisma.enderecoVendedor.findFirst({
      where: {
        EnderecoVendedorID: parseInt(enderecoId),
        VendedorID: user.vendedorId
      }
    });

    if (!enderecoExistente) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    // Verificar se já existe outro endereço com o mesmo nome para este vendedor
    if (Nome !== enderecoExistente.Nome) {
      const nomeDuplicado = await prisma.enderecoVendedor.findFirst({
        where: {
          VendedorID: user.vendedorId,
          Nome: Nome,
          EnderecoVendedorID: { not: parseInt(enderecoId) }
        }
      });

      if (nomeDuplicado) {
        return res.status(400).json({
          errors: ["Já existe um endereço com este nome"]
        });
      }
    }

    const endereco = await prisma.enderecoVendedor.update({
      where: { EnderecoVendedorID: parseInt(enderecoId) },
      data: {
        Nome,
        Complemento: Complemento || null,
        CEP,
        Cidade,
        UF,
        TipoEndereco: TipoEndereco || 'Comercial',
        Numero,
        Bairro
      }
    });

    res.json({ endereco });
  } catch (error) {
    logControllerError('vendor_atualizar_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir endereço do vendedor
export const excluirEndereco = async (req, res) => {
  try {
    const { user } = req;
    const { enderecoId } = req.params;

    if (!user?.vendedorId) {
      return res.status(403).json({ error: "Acesso negado. Vendedor não identificado." });
    }

    // Verificar se o endereço existe e pertence ao vendedor
    const endereco = await prisma.enderecoVendedor.findFirst({
      where: {
        EnderecoVendedorID: parseInt(enderecoId),
        VendedorID: user.vendedorId
      }
    });

    if (!endereco) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    await prisma.enderecoVendedor.delete({
      where: { EnderecoVendedorID: parseInt(enderecoId) }
    });

    res.json({ message: "Endereço excluído com sucesso" });
  } catch (error) {
    logControllerError('vendor_excluir_endereco_error', error, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};