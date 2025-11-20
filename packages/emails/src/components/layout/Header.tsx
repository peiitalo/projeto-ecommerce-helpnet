import React from 'react';
import { Section, Text } from '@react-email/components';

export const Header: React.FC = () => {
  return (
    <Section className="bg-gradient-to-r from-brand-primary to-brand-secondary text-black px-8 py-6 text-center">
      <Text className="text-3xl font-bold m-0 tracking-tight">
        HelpNet
      </Text>
      <Text className="text-lg font-medium m-0 mt-2 opacity-90">
        Sua loja online de confiança
      </Text>
    </Section>
  );
};