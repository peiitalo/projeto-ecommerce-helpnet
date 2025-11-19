import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar, ProductItem, Button } from '../../components/index.js';
import { OrderDeliveredEmailProps } from '../../types/email.types';

export const OrderDeliveredEmail: React.FC<OrderDeliveredEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  orderId,
  deliveryDate,
  receivedBy,
  products,
  total,
}) => {
  return (
    <EmailLayout title={`Pedido Entregue - Pedido #${orderId}`}>
      {/* Status Bar */}
      <StatusBar
        currentStatus={4}
        statusLabels={['Pedido Confirmado', 'Pagamento Aprovado', 'A Caminho', 'Entregue']}
      />

      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Pedido Entregue com Sucesso!
        </h1>
        <p className="text-base text-gray-600 italic">
          Seu pedido foi entregue e esperamos que tenha gostado.
        </p>
      </div>

      {/* Celebration Message */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 mb-6 text-center">
        <div className="text-6xl mb-4">🎊</div>
        <h3 className="text-2xl font-bold text-green-800 mb-4">
          Obrigado pela Preferência!
        </h3>
        <p className="text-base text-green-800 leading-relaxed">
          Seu pedido foi entregue com sucesso. Esperamos que tenha ficado satisfeito com sua compra.
        </p>
      </div>

      {/* Review Prompt */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-yellow-900">
          Ajude-nos a Melhorar
        </h3>
        <p className="mb-4 text-sm text-gray-600 leading-relaxed">
          Sua opinião é muito importante para nós! Avalie os produtos que recebeu e ajude outros clientes a fazerem boas escolhas.
        </p>
        <div className="text-center">
          <Button href={`${frontendUrl}/avaliar/${orderId}`}>
            AVALIAR PRODUTOS
          </Button>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Resumo da Entrega
        </h3>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Número do Pedido:</strong> #{orderId}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data de Entrega:</strong> {deliveryDate}
        </p>
        {receivedBy && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-semibold">Recebido por:</strong> {receivedBy}
          </p>
        )}
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Valor Recebido:</strong>{' '}
          <span className="font-bold text-green-600">R$ {total}</span>
        </p>
      </div>

      {/* Products Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase text-sm tracking-wide border-b-4 border-green-500 pb-2">
          Produtos Entregues
        </h2>
        {products.map((product, index) => (
          <ProductItem key={index} product={product} />
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-cyan-900">
          O que fazer agora?
        </h3>
        <ul className="m-0 pl-5 text-sm text-gray-600 leading-relaxed">
          <li className="mb-2">Avalie os produtos para ajudar outros clientes</li>
          <li className="mb-2">Entre em contato se houver algum problema</li>
          <li className="mb-2">Continue comprando em nossa loja</li>
          <li className="mb-0">Convide amigos para conhecer nossa plataforma</li>
        </ul>
      </div>

      {/* Message */}
      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Olá <strong className="text-gray-900 font-semibold">{recipientName}</strong>! Seu pedido foi entregue com sucesso. Esperamos que tenha ficado satisfeito com sua compra.
      </p>

      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        Sua avaliação é muito importante para nós e para outros clientes. Não esqueça de avaliar os produtos recebidos.
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