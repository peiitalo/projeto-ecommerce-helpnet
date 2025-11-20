import { OrderConfirmationEmail } from './dist/templates/client/OrderConfirmationEmail.js';
import { renderEmail } from './dist/utils/renderEmail.js';

const mockData = {
  recipientName: "João Silva",
  recipientEmail: "joao@example.com",
  frontendUrl: "https://helpnet.com",
  orderId: "12345",
  orderDate: "18/11/2025",
  paymentMethod: "Cartão de Crédito",
  shippingAddress: {
    rua: "Rua das Flores",
    numero: "123",
    bairro: "Centro",
    cidade: "São Paulo",
    cep: "01234-567"
  },
  products: [
    { nome: "Produto 1", preco: 50, quantidade: 2 },
    { nome: "Produto 2", preco: 30, quantidade: 1 }
  ],
  subtotal: 130,
  shipping: 10,
  total: 140
};

async function testEmail() {
  try {
    const emailComponent = OrderConfirmationEmail(mockData);
    const html = await renderEmail(emailComponent);
    console.log(html);
  } catch (error) {
    console.error('Error rendering email:', error);
  }
}

testEmail();