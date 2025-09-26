import axios from 'axios';

// Configuração do Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MERCADO_PAGO_BASE_URL = 'https://api.mercadopago.com';

// URLs padrão para ambiente de desenvolvimento
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

class PaymentService {
  constructor() {
    this.httpClient = axios.create({
      baseURL: MERCADO_PAGO_BASE_URL,
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Criar preferência de pagamento
  async criarPreferenciaPagamento(pedidoData) {
    try {
      // Verificar se o token do Mercado Pago está configurado
      if (!MERCADO_PAGO_ACCESS_TOKEN || MERCADO_PAGO_ACCESS_TOKEN === 'your-mercado-pago-access-token-here') {
        console.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado. Usando modo simulado.');
        // Retornar dados simulados para desenvolvimento
        return {
          preferenceId: `simulado_${pedidoData.id}`,
          initPoint: `${FRONTEND_URL}/checkout/pagamento/${pedidoData.id}`,
          sandboxInitPoint: `${FRONTEND_URL}/checkout/pagamento/${pedidoData.id}`
        };
      }

      const {
        id,
        total,
        cliente,
        itens,
        endereco,
        metodosPagamento
      } = pedidoData;

      // Preparar itens para Mercado Pago
      const items = itens.map(item => ({
        id: item.produtoId.toString(),
        title: item.nome,
        description: item.nome,
        quantity: item.quantidade,
        unit_price: parseFloat(item.precoUnitario),
        currency_id: 'BRL'
      }));

      // Dados do pagador
      const payer = {
        name: cliente.nome,
        email: cliente.email,
        identification: {
          type: 'CPF',
          number: cliente.cpf.replace(/\D/g, '')
        }
      };

      // URLs de retorno
      const back_urls = {
        success: `${FRONTEND_URL}/pedido/sucesso/${id}`,
        failure: `${FRONTEND_URL}/pedido/falha/${id}`,
        pending: `${FRONTEND_URL}/pedido/pendente/${id}`
      };

      // Criar preferência
      const preferenceData = {
        items,
        payer,
        back_urls,
        auto_return: 'approved',
        external_reference: id.toString(),
        notification_url: `${BACKEND_URL}/api/pagamentos/webhook`,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12
        }
      };

      const response = await this.httpClient.post('/checkout/preferences', preferenceData);

      return {
        preferenceId: response.data.id,
        initPoint: response.data.init_point,
        sandboxInitPoint: response.data.sandbox_init_point
      };

    } catch (error) {
      console.error('Erro ao criar preferência de pagamento:', error);

      // Se for erro de token inválido, tentar modo simulado
      if (error.response?.data?.message === 'invalid_token') {
        console.warn('Token do Mercado Pago inválido. Usando modo simulado.');
        return {
          preferenceId: `simulado_${pedidoData.id}`,
          initPoint: `${FRONTEND_URL}/checkout/pagamento/${pedidoData.id}`,
          sandboxInitPoint: `${FRONTEND_URL}/checkout/pagamento/${pedidoData.id}`
        };
      }

      throw new Error('Erro ao processar pagamento');
    }
  }

  // Verificar status do pagamento
  async verificarStatusPagamento(paymentId) {
    try {
      const response = await this.httpClient.get(`/v1/payments/${paymentId}`);
      return {
        id: response.data.id,
        status: response.data.status,
        statusDetail: response.data.status_detail,
        amount: response.data.transaction_amount,
        dateApproved: response.data.date_approved,
        paymentMethodId: response.data.payment_method_id,
        paymentTypeId: response.data.payment_type_id
      };
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw new Error('Erro ao verificar status do pagamento');
    }
  }

  // Processar webhook do Mercado Pago
  async processarWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      if (type === 'payment') {
        const paymentInfo = await this.verificarStatusPagamento(data.id);

        // Mapear status do Mercado Pago para status interno
        let statusInterno;
        switch (paymentInfo.status) {
          case 'approved':
            statusInterno = 'Aprovado';
            break;
          case 'pending':
            statusInterno = 'Pendente';
            break;
          case 'rejected':
            statusInterno = 'Rejeitado';
            break;
          case 'cancelled':
            statusInterno = 'Cancelado';
            break;
          default:
            statusInterno = 'Pendente';
        }

        return {
          paymentId: paymentInfo.id,
          status: statusInterno,
          amount: paymentInfo.amount,
          externalReference: paymentInfo.external_reference,
          paymentMethod: paymentInfo.paymentMethodId,
          paymentType: paymentInfo.paymentTypeId,
          dateApproved: paymentInfo.dateApproved
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Cancelar pagamento
  async cancelarPagamento(paymentId) {
    try {
      const response = await this.httpClient.put(`/v1/payments/${paymentId}`, {
        status: 'cancelled'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      throw new Error('Erro ao cancelar pagamento');
    }
  }

  // Reembolsar pagamento
  async reembolsarPagamento(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount } : {};
      const response = await this.httpClient.post(`/v1/payments/${paymentId}/refunds`, refundData);
      return response.data;
    } catch (error) {
      console.error('Erro ao reembolsar pagamento:', error);
      throw new Error('Erro ao reembolsar pagamento');
    }
  }
}

export default new PaymentService();