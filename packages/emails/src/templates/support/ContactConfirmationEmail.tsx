import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { StatusBar } from '../../components/ui/StatusBar';
import { ContactConfirmationEmailProps } from '../../types/email.types';

export const ContactConfirmationEmail: React.FC<ContactConfirmationEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  contactName,
  contactEmail,
  message,
  contactDate,
}) => {
  return (
    <EmailLayout title="Confirmação de contato - HelpNet">
      <StatusBar currentStatus={1} statusLabels={['Contato Recebido', 'Analisar Solicitação', 'Responder', 'Resolver']} />
      <p className="mb-4 text-base leading-relaxed text-gray-700">
        Olá {contactName},
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Obrigado por entrar em contato conosco!
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Recebemos sua mensagem e nossa equipe irá analisá-la o mais breve possível.
      </p>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-6">
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-blue-900 font-semibold">Data do contato:</strong> {contactDate}
        </p>
        <p className="mb-2 text-sm text-gray-600 leading-relaxed">
          <strong className="text-blue-900 font-semibold">Email:</strong> {contactEmail}
        </p>
        <p className="mb-0 text-sm text-gray-600 leading-relaxed">
          <strong className="text-blue-900 font-semibold">Mensagem:</strong><br />
          {message}
        </p>
      </div>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Entraremos em contato em até 24 horas úteis.
      </p>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span><br />
        <span className="text-sm text-gray-600">suporte@helpnet.com</span>
      </p>
    </EmailLayout>
  );
};