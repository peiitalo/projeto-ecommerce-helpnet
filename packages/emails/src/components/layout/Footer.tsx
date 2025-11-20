import React from 'react';
import { Section, Text, Link } from '@react-email/components';

interface FooterProps {
  showUnsubscribe?: boolean;
  unsubscribeLink?: string;
}

export const Footer: React.FC<FooterProps> = ({ showUnsubscribe = false, unsubscribeLink }) => {
  return (
    <Section className="bg-gray-100 px-8 py-6 text-center border-t border-gray-200">
      <Text className="text-sm text-gray-600 m-0 mb-2">
        Precisa de ajuda? Entre em contato conosco em{' '}
        <Link href="mailto:suporte@helpnet.com" className="text-brand-primary no-underline">
          suporte@helpnet.com
        </Link>
      </Text>
      {showUnsubscribe && unsubscribeLink && (
        <Text className="text-xs text-gray-500 m-0 mb-2">
          <Link href={unsubscribeLink} className="text-gray-500 no-underline">
            Cancelar inscrição
          </Link>
        </Text>
      )}
      <Text className="text-xs text-gray-500 m-0">
        © 2024 HelpNet. Todos os direitos reservados.
      </Text>
    </Section>
  );
};