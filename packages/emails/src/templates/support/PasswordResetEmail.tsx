import React from 'react';
import { EmailLayout } from '../../components/index.js';
import { Button } from '../../components/index.js';
import { StatusBar } from '../../components/ui/StatusBar';
import { PasswordResetEmailProps } from '../../types/email.types';

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  recipientName,
  recipientEmail,
  frontendUrl,
  resetToken,
  resetUrl,
}) => {
  return (
    <EmailLayout title="Redefinição de Senha - HelpNet">
      <StatusBar currentStatus={1} statusLabels={['Redefinição Solicitada', 'Verificar Identidade', 'Enviar Link', 'Senha Alterada']} />
      <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Redefinição de Senha
        </h1>
        <p className="text-base text-gray-600 italic">
          Recebemos uma solicitação para redefinir sua senha.
        </p>
      </div>

      <p className="mb-4 text-base leading-relaxed text-gray-700">
        Olá{recipientName ? ` ${recipientName}` : ''},
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Recebemos uma solicitação para redefinir sua senha no HelpNet.
      </p>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Para redefinir sua senha, clique no botão abaixo ou acesse a página de redefinição:
      </p>

      <div className="text-center my-8">
        <Button href={resetUrl}>
          Ir para Redefinição de Senha
        </Button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Seu Token de Reset:
        </h3>
        <p className="text-base font-mono bg-white border border-gray-300 rounded px-4 py-2 text-center text-blue-600 font-semibold">
          {resetToken}
        </p>
        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-1"><strong>Informações importantes:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Este token é válido por 1 hora</li>
            <li>Use-o na página de redefinição de senha</li>
            <li>Após expirar, solicite um novo token</li>
          </ul>
        </div>
      </div>

      <p className="mb-6 text-base leading-relaxed text-gray-700">
        Se você não solicitou esta redefinição, ignore este email.
      </p>

      <p className="mb-0 text-base font-semibold text-gray-800">
        Atenciosamente,<br />
        <span className="text-blue-500">Equipe HelpNet</span>
      </p>
    </EmailLayout>
  );
};