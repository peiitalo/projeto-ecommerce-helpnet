import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { Button } from '../../components/index.js';
import { StatusBar } from '../../components/ui/StatusBar';
import { VendorLowStockEmailProps } from '../../types/email.types';

export const LowStockEmail: React.FC<VendorLowStockEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  vendorName,
  productName,
  currentStock,
  recentSales,
}) => {
  return (
    <EmailLayout title="Alerta: Estoque baixo">
      <StatusBar currentStatus={1} statusLabels={['Estoque Baixo', 'Repor Produtos', 'Monitorar Vendas', 'Otimizar Inventário']} />
      <p className="mb-4 text-base leading-relaxed text-gray-700">
        Olá, {vendorName}!
      </p>

      <p className="mb-6 text-xl font-bold text-orange-600">
        Alerta de Estoque Baixo
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        O produto abaixo está com estoque baixo e precisa ser reabastecido:
      </p>

      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-orange-900 font-semibold">Produto:</strong> {productName}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-orange-900 font-semibold">Estoque Atual:</strong> {currentStock} unidades
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-orange-900 font-semibold">Vendas Recentes:</strong> {recentSales} unidades
        </p>
      </div>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Recomendamos reabastecer o estoque o mais breve possível para evitar interrupções nas vendas.
      </p>

      <div className="text-center my-8">
        <Button href={`${frontendUrl}/vendedor/produtos`}>
          Gerenciar Produtos
        </Button>
      </div>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};