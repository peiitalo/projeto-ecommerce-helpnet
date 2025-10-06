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

export const simularPagamentoSandbox = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { status = 'approved' } = req.body || {};

    const pedido = await prisma.pedido.findUnique({ where: { PedidoID: parseInt(pedidoId) } });
    if (!pedido) return res.status(404).json({ success: false, errors: ["Pedido não encontrado"] });

    let statusPagamento;
    let statusPedido;
    if (status === 'approved') { statusPagamento = 'Aprovado'; statusPedido = 'Pago'; }
    else if (status === 'rejected') { statusPagamento = 'Rejeitado'; statusPedido = 'Cancelado'; }
    else { statusPagamento = 'Pendente'; statusPedido = 'AguardandoPagamento'; }

    await prisma.$transaction(async (tx) => {
      await tx.pagamentosPedido.updateMany({
        where: { PedidoID: parseInt(pedidoId) },
        data: { StatusPagamento: statusPagamento, DataPagamento: statusPagamento === 'Aprovado' ? new Date() : null }
      });
      await tx.pedido.update({ where: { PedidoID: parseInt(pedidoId) }, data: { Status: statusPedido } });
    });

    if (statusPagamento === 'Aprovado') {
      await notificarVendedorPedidoPago(pedidoId);
      await criarEntregasAutomaticas(pedidoId);
    }

    return res.json({ success: true, pedidoId, status: statusPagamento });
  } catch (error) {
    logControllerError('simular_pagamento_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
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

// ===== Novos endpoints: registrar pagamento parcial e obter resumo =====

function formatCurrencyBRL(value) {
  return `R$ ${Number(value).toFixed(2)}`;
}

async function montarResumoPagamento(pedidoId) {
  const pedido = await prisma.pedido.findUnique({
    where: { PedidoID: parseInt(pedidoId) },
    include: {
      distribuicoes: { include: { MetodoPagamento: true } },
      pagamentosPedido: { include: { MetodoPagamento: true }, orderBy: { DataPagamento: 'desc' } }
    }
  });
  if (!pedido) return null;
  const totalRestante = Math.max(0, Math.round((pedido.Total - pedido.TotalPago) * 100) / 100);
  const metodos = pedido.distribuicoes.map(d => ({
    metodoId: d.MetodoID,
    metodo: d.MetodoPagamento?.Nome,
    alocado: d.ValorAlocado,
    pago: d.ValorPagoAcumulado,
    restante: Math.max(0, Math.round((d.ValorAlocado - d.ValorPagoAcumulado) * 100) / 100)
  }));
  return {
    pedidoId: pedido.PedidoID,
    total: pedido.Total,
    totalPago: pedido.TotalPago,
    totalRestante,
    statusPagamento: pedido.StatusPagamento,
    expiraEm: pedido.ExpiraEm,
    metodos,
    historico: pedido.pagamentosPedido.map(p => ({
      id: p.PagamentoID,
      metodoId: p.MetodoID,
      metodo: p.MetodoPagamento?.Nome,
      valor: p.ValorPago,
      status: p.StatusPagamento,
      data: p.DataPagamento
    }))
  };
}

function calcularNovoStatus(total, totalPago, expiraEm) {
  const quitado = (totalPago + 1e-6) >= total;
  if (quitado) return 'PAGO';
  const agora = new Date();
  if (expiraEm && agora > new Date(expiraEm)) return 'EXPIRADO';
  if (totalPago > 0) return 'PARCIAL';
  return 'PENDENTE';
}

export const obterResumoPagamentos = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { user } = req;

    const pedido = await prisma.pedido.findFirst({
      where: { PedidoID: parseInt(pedidoId), ClienteID: user.id }
    });
    if (!pedido) return res.status(404).json({ success: false, errors: ['Pedido não encontrado'] });

    // Atualiza status on-the-fly se necessário
    const novoStatus = calcularNovoStatus(pedido.Total, pedido.TotalPago, pedido.ExpiraEm);
    if (novoStatus !== pedido.StatusPagamento) {
      await prisma.pedido.update({ where: { PedidoID: pedido.PedidoID }, data: { StatusPagamento: novoStatus } });
    }

    const resumo = await montarResumoPagamento(pedidoId);
    return res.json({ success: true, resumo });
  } catch (error) {
    logControllerError('obter_resumo_pagamentos_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

export const registrarPagamentoParcial = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { metodoId, valor } = req.body || {};
    const { user } = req;

    const valorPago = Math.round(parseFloat(valor) * 100) / 100; // Round to 2 decimal places
    if (!metodoId || !valorPago || valorPago <= 0) {
      return res.status(400).json({ success: false, errors: ['Parâmetros inválidos: metodoId e valor > 0 são obrigatórios'] });
    }

    const pedido = await prisma.pedido.findFirst({ where: { PedidoID: parseInt(pedidoId), ClienteID: user.id } });
    if (!pedido) return res.status(404).json({ success: false, errors: ['Pedido não encontrado'] });

    if (pedido.StatusPagamento === 'PAGO') {
      return res.status(400).json({ success: false, errors: ['Pedido já está totalmente pago'] });
    }

    const agora = new Date();
    if (pedido.ExpiraEm && agora > new Date(pedido.ExpiraEm)) {
      return res.status(400).json({ success: false, errors: ['Pedido expirado. Não é possível registrar pagamento.'] });
    }

    const dist = await prisma.distribuicaoPagamentoPedido.findFirst({
      where: { PedidoID: pedido.PedidoID, MetodoID: parseInt(metodoId) },
      include: { MetodoPagamento: true }
    });
    if (!dist) return res.status(400).json({ success: false, errors: ['Método de pagamento não alocado neste pedido'] });

    const restanteMetodo = Math.max(0, Math.round((dist.ValorAlocado - dist.ValorPagoAcumulado) * 100) / 100);
    const restantePedido = Math.max(0, Math.round((pedido.Total - pedido.TotalPago) * 100) / 100);

    if (valorPago > restanteMetodo + 1e-6) {
      return res.status(400).json({ success: false, errors: [`Pagamento excede o restante do método (${formatCurrencyBRL(restanteMetodo)})`] });
    }
    if (valorPago > restantePedido + 1e-6) {
      return res.status(400).json({ success: false, errors: [`Pagamento excede o restante do pedido (${formatCurrencyBRL(restantePedido)})`] });
    }

    let novoStatus;
    await prisma.$transaction(async (tx) => {
      // Registrar transação como Aprovado (simulação)
      await tx.pagamentosPedido.create({
        data: {
          PedidoID: pedido.PedidoID,
          MetodoID: dist.MetodoID,
          ValorPago: valorPago,
          StatusPagamento: 'Aprovado',
          DataPagamento: new Date()
        }
      });

      // Atualizar acumulados
      await tx.distribuicaoPagamentoPedido.update({
        where: { DistribuicaoID: dist.DistribuicaoID },
        data: { ValorPagoAcumulado: { increment: valorPago } }
      });

      const totalPagoNovo = pedido.TotalPago + valorPago;
      novoStatus = calcularNovoStatus(pedido.Total, totalPagoNovo, pedido.ExpiraEm);

      await tx.pedido.update({
        where: { PedidoID: pedido.PedidoID },
        data: {
          TotalPago: totalPagoNovo,
          StatusPagamento: novoStatus,
          // Opcional: ajustar Status textual
          Status: novoStatus === 'PAGO' ? 'Pago' : (novoStatus === 'PARCIAL' ? 'AguardandoPagamento' : pedido.Status)
        }
      });
    });

    // Pós-processamento quando quitado (fora da transação para evitar timeout)
    if (novoStatus === 'PAGO') {
      await notificarVendedorPedidoPago(pedido.PedidoID);
      await criarEntregasAutomaticas(pedido.PedidoID);
    }

    const resumo = await montarResumoPagamento(pedidoId);
    return res.json({ success: true, message: 'Pagamento registrado', resumo });
  } catch (error) {
    logControllerError('registrar_pagamento_parcial_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};

export const atualizarStatusPagamento = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { status } = req.body || {};
    const permitidos = ['PENDENTE', 'PARCIAL', 'PAGO', 'EXPIRADO'];
    if (!permitidos.includes(status)) {
      return res.status(400).json({ success: false, errors: ['Status inválido'] });
    }

    const pedido = await prisma.pedido.findUnique({ where: { PedidoID: parseInt(pedidoId) } });
    if (!pedido) return res.status(404).json({ success: false, errors: ['Pedido não encontrado'] });

    await prisma.pedido.update({ where: { PedidoID: pedido.PedidoID }, data: { StatusPagamento: status } });
    const resumo = await montarResumoPagamento(pedidoId);
    return res.json({ success: true, resumo });
  } catch (error) {
    logControllerError('atualizar_status_pagamento_error', error, req);
    res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
  }
};