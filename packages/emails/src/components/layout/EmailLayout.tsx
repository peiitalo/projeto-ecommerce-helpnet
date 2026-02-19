import React from 'react';
import { Html, Head, Body, Container, Section } from '@react-email/components';
import { Header } from './Header.js';
import { Footer } from './Footer.js';

interface EmailLayoutProps {
  title: string;
  children: React.ReactNode;
  showUnsubscribe?: boolean;
  unsubscribeLink?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  title,
  children,
  showUnsubscribe = false,
  unsubscribeLink,
}) => {
  return (
    <Html lang="pt-BR">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Body className="bg-gray-50 font-sans m-0 p-0">
        <Container className="max-w-2xl mx-auto bg-white shadow-lg my-8">
          <Header />
          <Section className="px-8 py-6">
            {children}
          </Section>
          <Footer showUnsubscribe={showUnsubscribe} unsubscribeLink={unsubscribeLink} />
        </Container>
      </Body>
    </Html>
  );
};