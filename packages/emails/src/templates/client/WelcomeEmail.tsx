import React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import { EmailLayout } from '../../components/layout/EmailLayout.js';
import { StatusBar } from '../../components/ui/StatusBar';
import { BaseEmailProps } from '../../types/email.types';

interface WelcomeEmailProps extends BaseEmailProps {}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  recipientName,
  frontendUrl,
}) => {
  return (
    <EmailLayout title="Bem-vindo ao HelpNet!">
      <StatusBar
        currentStatus={1}
        statusLabels={['Bem-vindo', 'Explorar Produtos', 'Fazer Pedido', 'Receber Produto']}
      />
      <Section className="text-center py-8">
        <div className="text-6xl mb-6">🎉</div>
        <Heading className="text-3xl font-bold text-gray-900 mb-4">
          Bem-vindo ao HelpNet, {recipientName}!
        </Heading>
        <Text className="text-lg text-gray-700 mb-6 leading-relaxed">
          Sua conta foi criada com sucesso! Estamos muito felizes em tê-lo conosco.
        </Text>
        <Text className="text-base text-gray-600 mb-8 leading-relaxed">
          Explore nossa plataforma e descubra produtos incríveis de vendedores locais.
          Comece sua jornada de compras agora mesmo!
        </Text>
        <Button
          href={`${frontendUrl}/explorar`}
          className="bg-brand-primary text-white px-8 py-4 rounded-lg font-semibold text-lg no-underline inline-block"
        >
          Começar a Explorar
        </Button>
      </Section>

      <Section className="bg-gray-50 p-6 rounded-lg mt-8">
        <Heading className="text-xl font-semibold text-gray-900 mb-4">
          O que você pode fazer agora:
        </Heading>
        <ul className="text-gray-700 space-y-2">
          <li>📦 Explorar produtos de diversos vendedores</li>
          <li>❤️ Salvar seus produtos favoritos</li>
          <li>🛒 Fazer compras com segurança</li>
          <li>📱 Acompanhar seus pedidos em tempo real</li>
          <li>💬 Entrar em contato com vendedores</li>
        </ul>
      </Section>

      <Section className="text-center mt-8">
        <Text className="text-gray-600">
          Se tiver alguma dúvida, nossa equipe está sempre pronta para ajudar.
        </Text>
      </Section>
    </EmailLayout>
  );
};