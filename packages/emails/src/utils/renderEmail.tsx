import { render } from '@react-email/render';
import { Tailwind } from '@react-email/tailwind';
import React from 'react';

const tailwindConfig = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5',
          secondary: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Essential for emails
  },
};

export const renderEmail = async (component: React.ReactElement): Promise<string> => {
  const wrappedComponent = <Tailwind config={tailwindConfig}>{component}</Tailwind>;
  return render(wrappedComponent, {
    pretty: true,
  });
};