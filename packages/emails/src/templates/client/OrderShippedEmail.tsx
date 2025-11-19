import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar, ProductItem, Button } from '../../components/index.js';
import { OrderShippedEmailProps } from '../../types/email.types';

export const OrderShippedEmail: React.FC<OrderShippedEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  orderId,
  shippingDate,
  trackingCode,
  carrier,
  estimatedDelivery,
  status,
  products,
  shippingAddress,
  total,
}) => {
  return (
    <EmailLayout title={`Pedido Enviado - Pedido #${orderId}`}>
      {/* Status Bar */}
      <StatusBar
        currentStatus={3}
        statusLabels={['Pedido Confirmado', 'Pagamento Aprovado', 'A Caminho', 'Entregue']}
      />

      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-8">
        <div className="text-5xl mb-4">🚚</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Seu Pedido Está a Caminho!
        </h1>
        <p className="text-base text-gray-600 italic">
          Os produtos foram despachados e estão sendo entregues.
        </p>
      </div>

      {/* Shipping Info */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-6 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          Pedido Enviado
        </h3>
        <p className="text-base text-blue-900 leading-relaxed">
          Seu pedido foi preparado e enviado para entrega. Acompanhe o rastreamento abaixo.
        </p>
      </div>

      {/* Tracking Info */}
      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-cyan-900">
          Informações de Rastreamento
        </h3>
        {trackingCode && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-cyan-900 font-semibold">Código de Rastreamento:</strong> {trackingCode}
          </p>
        )}
        {carrier && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-cyan-900 font-semibold">Transportadora:</strong> {carrier}
          </p>
        )}
        {estimatedDelivery && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-cyan-900 font-semibold">Previsão de Entrega:</strong> {estimatedDelivery}
          </p>
        )}
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-cyan-900 font-semibold">Status Atual:</strong> {status}
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Detalhes da Remessa
        </h3>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Número do Pedido:</strong> #{orderId}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data de Envio:</strong> {shippingDate}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Valor do Pedido:</strong>{' '}
          <span className="font-bold text-green-600">R$ {total}</span>
        </p>
      </div>

      {/* Products Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase text-sm tracking-wide border-b-4 border-blue-500 pb-2">
          Produtos Enviados
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

      {/* Message */}
      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Olá <strong className="text-gray-900 font-semibold">{recipientName}</strong>! Seu pedido foi enviado e está a caminho da sua casa.
      </p>

      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        Use o código de rastreamento acima para acompanhar a entrega em tempo real. Você receberá uma notificação quando o pedido for entregue.
      </p>

      {/* CTA Button */}
      {trackingCode && (
        <div className="text-center my-8">
          <Button href={`${frontendUrl}/rastreamento/${trackingCode}`}>
            RASTREAR ENTREGA
          </Button>
        </div>
      )}

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};