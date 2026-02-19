import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar, ProductItem, Button } from '../../components/index.js';
import { OrderPaidEmailProps } from '../../types/email.types';

export const OrderPaidEmail: React.FC<OrderPaidEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  orderId,
  paymentDate,
  paymentMethod,
  products,
  total,
}) => {
  return (
    <EmailLayout title={`Pagamento Aprovado - Pedido #${orderId}`}>
      {/* Status Bar */}
      <StatusBar
        currentStatus={2}
        statusLabels={['Pedido Confirmado', 'Pagamento Aprovado', 'A Caminho', 'Entregue']}
      />

      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-8">
        <div className="text-5xl mb-4">💳</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Pagamento Aprovado!
        </h1>
        <p className="text-base text-gray-600 italic">
          Seu pagamento foi processado com sucesso.
        </p>
      </div>

      {/* Success Message */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 mb-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-4">
          Pagamento Confirmado
        </h3>
        <p className="text-base text-green-800 leading-relaxed">
          Seu pagamento foi aprovado e seu pedido está sendo preparado para envio.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Resumo do Pedido
        </h3>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Número do Pedido:</strong> #{orderId}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data do Pagamento:</strong> {paymentDate}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Método de Pagamento:</strong> {paymentMethod}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Valor Pago:</strong>{' '}
          <span className="font-bold text-green-600">R$ {total}</span>
        </p>
      </div>

      {/* Products Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase text-sm tracking-wide border-b-4 border-blue-500 pb-2">
          Produtos Aprovados
        </h2>
        {products.map((product, index) => (
          <ProductItem key={index} product={product} />
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-orange-900">
          Próximos Passos
        </h3>
        <ul className="m-0 pl-5 text-sm text-gray-600 leading-relaxed">
          <li className="mb-2">Seu pedido será preparado para envio</li>
          <li className="mb-2">Você receberá uma atualização quando o pedido sair para entrega</li>
          <li className="mb-0">Acompanhe o status do seu pedido em tempo real</li>
        </ul>
      </div>

      {/* Message */}
      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Olá <strong className="text-gray-900 font-semibold">{recipientName}</strong>! Seu pagamento foi aprovado com sucesso. Agora estamos preparando seu pedido para envio.
      </p>

      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        Você receberá notificações sobre cada etapa do processo de entrega. Qualquer dúvida, estamos à disposição.
      </p>

      {/* CTA Button */}
      <div className="text-center my-8">
        <Button href={`${frontendUrl}/pedidos/${orderId}`}>
          VER MEU PEDIDO
        </Button>
      </div>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};