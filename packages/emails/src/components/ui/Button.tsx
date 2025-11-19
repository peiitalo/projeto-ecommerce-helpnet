import React from 'react';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ href, children, className = '' }) => {
  return (
    <a
      href={href}
      className={`inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-4 text-base font-semibold text-center no-underline rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 min-h-[44px] leading-tight ${className}`}
      style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
        boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
      }}
    >
      {children}
    </a>
  );
};