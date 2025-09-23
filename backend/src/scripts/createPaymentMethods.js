// backend/src/scripts/createPaymentMethods.js
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

const paymentMethods = [
  { nome: 'PIX', ativo: true },
  { nome: 'Cartão de Crédito', ativo: true },
  { nome: 'Cartão de Débito', ativo: true },
  { nome: 'Boleto Bancário', ativo: true },
  { nome: 'Transferência Bancária', ativo: true }
];

async function createPaymentMethods() {
  try {
    logger.info('create_payment_methods_start');

    for (const method of paymentMethods) {
      const existing = await prisma.metodoPagamento.findFirst({
        where: { Nome: method.nome }
      });

      if (!existing) {
        await prisma.metodoPagamento.create({
          data: { Nome: method.nome, Ativo: method.ativo }
        });
        logger.info('payment_method_created', { nome: method.nome });
      } else {
        logger.info('payment_method_already_exists', { nome: method.nome });
      }
    }

    logger.info('create_payment_methods_success');
  } catch (error) {
    logger.error('create_payment_methods_error', { error: error.message });
    throw error;
  }
}

export default createPaymentMethods;

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createPaymentMethods()
    .then(() => {
      logger.info('script_completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('script_failed', { error: error.message });
      process.exit(1);
    });
}