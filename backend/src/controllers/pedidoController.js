// backend/src/controllers/pedidoController.js
import prisma from '../config/prisma.js';
import { logControllerError } from '../utils/logger.js';

export const criar = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { produtoIds, enderecoId, metodoPagamentoId } = req.body || {};

    if (!produtoIds || !Array.isArray(produtoIds) || produtoIds.length === 0) {
      return res.status(400).json({ erro: 'produtoIds é obrigatório e deve ser um array não vazio' });
    }
    if (!enderecoId) return res.status(400).json({ erro: 'enderecoId é obrigatório' });

    // Verificar se o endereço pertence ao usuário
    const endereco = await prisma.endereco.findFirst({
      where: { EnderecoID: parseInt(enderecoId), ClienteID: userId }
    });
    if (!endereco) return res.status(404).json({ erro: 'Endereço não encontrado' });

    // Buscar itens do carrinho para os produtos selecionados
    const carrinhoItens = await prisma.carrinhoItem.findMany({
      where: {
        ClienteID: userId,
        ProdutoID: { in: produtoIds.map(id => parseInt(id)) }
      },
      include: { produto: true }
    });

    if (carrinhoItens.length === 0) return res.status(400).json({ erro: 'Nenhum item válido no carrinho' });

    // Calcular total
    let total = 0;
    const itensPedido = carrinhoItens.map(item => {
      const preco = item.produto.Preco;
      total += preco * item.Quantidade;
      return {
        ProdutoID: item.ProdutoID,
        Quantidade: item.Quantidade,
        PrecoUnitario: preco
      };
    });

    // Criar pedido em transação
    const pedido = await prisma.$transaction(async (tx) => {
      // Criar pedido
      const novoPedido = await tx.pedido.create({
        data: {
          ClienteID: userId,
          EnderecoID: parseInt(enderecoId),
          Total: total,
          Status: 'Pendente'
        }
      });

      // Criar itens do pedido
      await tx.itensPedido.createMany({
        data: itensPedido.map(item => ({
          PedidoID: novoPedido.PedidoID,
          ...item
        }))
      });

      // Criar pagamento se método fornecido
      if (metodoPagamentoId) {
        await tx.pagamentosPedido.create({
          data: {
            PedidoID: novoPedido.PedidoID,
            MetodoID: parseInt(metodoPagamentoId),
            ValorPago: total,
            StatusPagamento: 'Pendente'
          }
        });
      }

      // Remover itens do carrinho
      await tx.carrinhoItem.deleteMany({
        where: {
          ClienteID: userId,
          ProdutoID: { in: produtoIds.map(id => parseInt(id)) }
        }
      });

      return novoPedido;
    });

    res.status(201).json({ pedido });
  } catch (error) {
    logControllerError('criar_pedido_error', error, req);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};