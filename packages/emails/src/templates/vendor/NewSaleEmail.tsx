import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { Button } from '../../components/index.js';
import { StatusBar } from '../../components/ui/StatusBar';
import { VendorNewSaleEmailProps } from '../../types/email.types';

export const NewSaleEmail: React.FC<VendorNewSaleEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  vendorName,
  orderId,
  orderDate,
  products,
  totalValue,
}) => {
  return (
    <EmailLayout title="Nova venda recebida!">
      <StatusBar currentStatus={1} statusLabels={['Nova Venda', 'Preparar Envio', 'Enviar Produto', 'Entregar']} />
      <p className="mb-4 text-base leading-relaxed text-gray-700">
        Olá, {vendorName}!
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Você recebeu uma nova venda no HelpNet!
      </p>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Pedido #{orderId}</strong>
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data:</strong> {orderDate}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Valor Total Recebido:</strong>{' '}
          <span className="font-bold text-green-600">R$ {totalValue}</span>
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Produtos Vendidos
      </h3>

      <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">
              Produto
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">
              Quantidade
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">
              Preço Unitário
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index} className="bg-white">
              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                {product.nome}
              </td>
              <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-700">
                {product.quantidade}
              </td>
              <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-700">
                R$ {product.preco}
              </td>
              <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-700">
                R$ {(product.preco * product.quantidade).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center my-8">
        <Button href={`${frontendUrl}/vendedor/pedidos`}>
          Ver Pedidos
        </Button>
      </div>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Prepare os produtos para envio o mais breve possível.
      </p>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};