import { OrderConfirmationEmail, renderEmail } from './packages/emails/dist/index.js';

async function testEmail() {
  try {
    const component = OrderConfirmationEmail({
      recipientName: 'João Silva',
      recipientEmail: 'joao@example.com',
      frontendUrl: 'http://localhost:5173',
      orderId: '12345',
      orderDate: '15/11/2025',
      paymentMethod: 'Cartão de Crédito',
      shippingAddress: {
        rua: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        cep: '01234-567'
      },
      products: [
        {
          nome: 'Produto Teste',
          imagem: 'https://example.com/image.jpg',
          preco: 99.99,
          quantidade: 2
        }
      ],
      subtotal: 199.98,
      shipping: 10.00,
      total: 209.98,
    });

    const html = await renderEmail(component);
    console.log('Email rendered successfully!');
    console.log('HTML length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
  } catch (error) {
    console.error('Error rendering email:', error);
  }
}

testEmail();