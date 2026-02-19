import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar, Button } from '../../components/index.js';
import { DeliveryStatusEmailProps } from '../../types/email.types';

export const DeliveryStatusEmail: React.FC<DeliveryStatusEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  orderId,
  status,
  trackingCode,
  estimatedDelivery,
  deliveryLocation,
  statusUpdateDate,
  showTrackingButton,
  isDelivered,
}) => {
  const getStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 1;
      case 'paid':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <EmailLayout title={`Atualização no seu pedido #${orderId}`}>
      {/* Status Bar */}
      <StatusBar
        currentStatus={getStatusStep(status)}
        statusLabels={['Pedido Confirmado', 'Pagamento Aprovado', 'A Caminho', 'Entregue']}
      />

      <p className="mb-4 text-base leading-relaxed text-gray-700">
        Olá, {recipientName}!
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Atualização sobre seu pedido #{orderId}:
      </p>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Status:</strong> {status}
        </p>
        {trackingCode && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-semibold">Código de Rastreio:</strong> {trackingCode}
          </p>
        )}
        {estimatedDelivery && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-semibold">Previsão de Entrega:</strong> {estimatedDelivery}
          </p>
        )}
        {deliveryLocation && (
          <p className="mb-2 text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-semibold">Localização:</strong> {deliveryLocation}
          </p>
        )}
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-gray-900 font-semibold">Data da Atualização:</strong> {statusUpdateDate}
        </p>
      </div>

      {showTrackingButton && (
        <div className="text-center my-8">
          <Button href={`${frontendUrl}/entregas/${orderId}`}>
            Acompanhar Entrega
          </Button>
        </div>
      )}

      {isDelivered && (
        <div className="mb-6">
          <p className="mb-4 text-base leading-relaxed text-gray-700">
            Seu pedido foi entregue com sucesso! Esperamos que tenha gostado dos produtos.
          </p>
          <p className="mb-6 text-base leading-relaxed text-gray-700">
            Conte-nos sua experiência avaliando os produtos em seu pedido.
          </p>
        </div>
      )}

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};