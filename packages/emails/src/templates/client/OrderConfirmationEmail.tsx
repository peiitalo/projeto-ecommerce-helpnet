import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar, ProductItem, OrderSummary, Button } from '../../components/index.js';
import { OrderConfirmationEmailProps } from '../../types/email.types';

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  orderId,
  orderDate,
  paymentMethod,
  shippingAddress,
  products,
  subtotal,
  shipping,
  total,
}) => {
  return (
    <EmailLayout title={`Confirmação de Pedido #${orderId}`}>
      {/* Status Bar */}
      <StatusBar
        currentStatus={1}
        statusLabels={['Pedido Confirmado', 'Pagamento Aprovado', 'A Caminho', 'Entregue']}
      />

      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-8">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Pedido Confirmado!
        </h1>
        <p className="text-base text-gray-600 italic">
          Seu pedido foi recebido e está sendo processado.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Detalhes do Pedido
        </h3>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Número do Pedido:</strong> #{orderId}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data do Pedido:</strong> {orderDate}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Método de Pagamento:</strong> {paymentMethod}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Total:</strong>{' '}
          <span className="font-bold text-red-500">R$ {total}</span>
        </p>
      </div>

      {/* Products Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase text-sm tracking-wide border-b-4 border-blue-500 pb-2">
          Produtos do Pedido
        </h2>
        {products.map((product, index) => (
          <ProductItem key={index} product={product} />
        ))}
      </div>

      {/* Delivery Address */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Endereço de Entrega
        </h3>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Destinatário:</strong> {recipientName}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Endereço:</strong><br />
          {shippingAddress.rua && `${shippingAddress.rua}${shippingAddress.numero ? `, ${shippingAddress.numero}` : ''}`}
          {shippingAddress.bairro && <><br />{shippingAddress.bairro}</>}
          {shippingAddress.cidade && <><br />{shippingAddress.cidade}</>}
          {shippingAddress.cep && <><br />CEP: {shippingAddress.cep}</>}
        </p>
      </div>

      {/* Order Summary */}
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} />

      {/* CTA Button */}
      <div className="text-center my-8">
        <Button href={`${frontendUrl}/pedidos/${orderId}`}>
          ACOMPANHAR PEDIDO
        </Button>
      </div>

      {/* Message */}
      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Olá <strong className="text-gray-900 font-semibold">{recipientName}</strong>! Obrigado por sua compra na HelpNet. Seu pedido foi confirmado e estamos processando-o com todo cuidado.
      </p>

      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        Você receberá atualizações sobre o status do seu pedido por email. Em caso de dúvidas, nossa equipe está sempre disponível para ajudar.
      </p>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};