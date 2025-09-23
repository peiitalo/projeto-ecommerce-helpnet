// backend/src/controllers/pagamentoController.js
import prisma from "../config/prisma.js";
import paymentService from "../services/paymentService.js";
import { logControllerError, logger } from "../utils/logger.js";

export const webhookPagamento = async (req, res) => {
  try {
    const webhookData = req.body;

    logger.info('webhook_pagamento_recebido', {
      type: webhookData.type,
      dataId: webhookData.data?.id
    });

    const paymentResult = await paymentService.processarWebhook(webhookData);

    if (paymentResult) {
      // Atualizar status do pagamento no banco
      const pagamentoAtualizado = await prisma.pagamentosPedido.updateMany({
        where: {
          PedidoID: parseInt(paymentResult.externalReference)
        },
        data: {
          StatusPagamento: paymentResult.status,
          DataPagamento: paymentResult.dateApproved ? new Date(paymentResult.dateApproved) : undefined
        }
      });

      // Atualizar status do pedido baseado no pagamento
      let novoStatusPedido;
      if (paymentResult.status === 'Aprovado') {
        novoStatusPedido = 'Pago';
      } else if (paymentResult.status === 'Rejeitado' || paymentResult.status === 'Cancelado') {
        novoStatusPedido = 'Cancelado';
      } else {
        novoStatusPedido = 'AguardandoPagamento';
      }

      await prisma.pedido.update({
        where: { PedidoID: parseInt(paymentResult.externalReference) },
        data: { Status: novoStatusPedido }
      });

      // Se pagamento aprovado, notificar vendedor e criar entregas
      if (paymentResult.status === 'Aprovado') {
        await notificarVendedorPedidoPago(paymentResult.externalReference);
        await criarEntregasAutomaticas(paymentResult.externalReference);
      }

      logger.info('pagamento_atualizado_webhook', {
        pedidoId: paymentResult.externalReference,
        status: paymentResult.status,
        novoStatusPedido
      });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    logControllerError('webhook_pagamento_error', error, req);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

export const verificarStatusPagamento = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { user } = req;

    // Verificar se o pedido pertence ao cliente
    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(pedidoId),
        ClienteID: user.id
      },
      include: {
        pagamentosPedido: {
          include: {
            MetodoPagamento: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado"]
      });
    }

    res.json({
      success: true,
      pedido: {
        id: pedido.PedidoID,
        status: pedido.Status,
        pagamentos: pedido.pagamentosPedido.map(p => ({
          id: p.PagamentoID,
          metodo: p.MetodoPagamento.Nome,
          valor: p.ValorPago,
          status: p.StatusPagamento,
          data: p.DataPagamento
        }))
      }
    });

  } catch (error) {
    logControllerError('verificar_status_pagamento_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Função auxiliar para notificar vendedor
async function notificarVendedorPedidoPago(pedidoId) {
  try {
    // Buscar itens do pedido com informações do vendedor
    const itensPedido = await prisma.itensPedido.findMany({
      where: { PedidoID: parseInt(pedidoId) },
      include: {
        produto: {
          include: {
            vendedor: true
          }
        }
      }
    });

    // Agrupar por vendedor
    const vendedoresNotificar = new Set();
    for (const item of itensPedido) {
      if (item.produto.vendedor) {
        vendedoresNotificar.add(item.produto.vendedor.VendedorID);
      }
    }

    // Criar notificações para cada vendedor
    for (const vendedorId of vendedoresNotificar) {
      await prisma.notificacao.create({
        data: {
          Titulo: 'Novo Pedido Pago',
          Mensagem: `Você recebeu um novo pedido pago. Pedido #${pedidoId}`,
          Tipo: 'success',
          VendedorID: vendedorId
        }
      });
    }

    logger.info('notificacoes_vendedor_enviadas', {
      pedidoId,
      vendedores: Array.from(vendedoresNotificar)
    });

  } catch (error) {
    logger.error('erro_notificar_vendedor', {
      pedidoId,
      error: error.message
    });
  }
}

// Função para criar entregas automaticamente quando pagamento é aprovado
async function criarEntregasAutomaticas(pedidoId) {
  try {
    // Buscar itens do pedido agrupados por vendedor
    const itensPedido = await prisma.itensPedido.findMany({
      where: { PedidoID: parseInt(pedidoId) },
      include: {
        produto: {
          include: {
            vendedor: true
          }
        }
      }
    });

    // Agrupar por vendedor
    const itensPorVendedor = new Map();
    for (const item of itensPedido) {
      if (item.produto.vendedor) {
        const vendedorId = item.produto.vendedor.VendedorID;
        if (!itensPorVendedor.has(vendedorId)) {
          itensPorVendedor.set(vendedorId, {
            vendedor: item.produto.vendedor,
            itens: []
          });
        }
        itensPorVendedor.get(vendedorId).itens.push(item);
      }
    }

    // Criar entrega para cada vendedor
    for (const [vendedorId, dados] of itensPorVendedor) {
      // Calcular previsão de entrega (7 dias úteis)
      const previsaoEntrega = new Date();
      previsaoEntrega.setDate(previsaoEntrega.getDate() + 7);

      const entrega = await prisma.entrega.create({
        data: {
          PedidoID: parseInt(pedidoId),
          StatusEntrega: 'AguardandoEnvio',
          PrevisaoEntrega: previsaoEntrega,
          Observacoes: `Entrega automática criada para produtos do vendedor ${dados.vendedor.Nome}`
        }
      });

      // Criar rastreamento inicial
      await prisma.rastreamento.create({
        data: {
          EntregaID: entrega.EntregaID,
          Status: 'Pagamento aprovado - aguardando envio',
          Local: 'Sistema automático'
        }
      });

      logger.info('entrega_automatica_criada', {
        entregaId: entrega.EntregaID,
        pedidoId,
        vendedorId
      });
    }

  } catch (error) {
    logger.error('erro_criar_entregas_automaticas', {
      pedidoId,
      error: error.message
    });
  }
}