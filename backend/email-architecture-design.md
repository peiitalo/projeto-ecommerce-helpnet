# Email System Architecture Design - React Email Migration

## Overview

This document outlines the new email system architecture using React Email components to replace the current Handlebars-based implementation. The goal is to create a scalable, maintainable solution that resolves styling issues and improves developer experience.

## Current Implementation Analysis

### Handlebars System
- **Templates**: Located in `backend/src/templates/emails/` with `.hbs` files
- **Partials**: Shared components like `status-bar.hbs` and `product-item.hbs`
- **Styling**: Inline CSS injected into base template, Tailwind CDN loaded but inconsistently used
- **Issues**:
  - Complex inline styles with duplication
  - Hard to maintain and debug
  - Limited reusability
  - Email client compatibility challenges

### Email Types
1. **Client Emails**:
   - Welcome email
   - Order confirmation
   - Delivery status updates
   - Order paid/shipped/delivered

2. **Vendor Emails**:
   - New sale notifications
   - Low stock alerts

3. **Support Emails**:
   - Contact confirmations
   - Password reset

## New React Email Architecture

### Architecture Overview

```mermaid
graph TD
    A[emailService.js] --> B{Email Type}
    B --> C[Welcome Email]
    B --> D[Order Emails]
    B --> E[Vendor Emails]
    B --> F[Support Emails]

    C --> G[React Email Component]
    D --> G
    E --> G
    F --> G

    G --> H[Shared Components]
    H --> I[EmailLayout]
    H --> J[Header]
    H --> K[Footer]
    H --> L[Button]
    H --> M[ProductItem]
    H --> N[StatusBar]

    G --> O[renderEmail utility]
    O --> P[@react-email/render]
    P --> Q[HTML Output]
    Q --> R[SendGrid/SMTP]
```

### 1. Directory Structure

```
packages/
├── emails/                         # Separate email package
│   ├── package.json               # Email package configuration
│   ├── tailwind.config.js         # Email-specific Tailwind config
│   ├── tsconfig.json              # TypeScript configuration
│   ├── src/
│   │   ├── components/            # Shared email components
│   │   │   ├── layout/
│   │   │   │   ├── EmailLayout.tsx    # Base email wrapper
│   │   │   │   ├── Header.tsx        # Email header with logo
│   │   │   │   └── Footer.tsx        # Email footer
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx        # Reusable button component
│   │   │   │   ├── ProductItem.tsx   # Product display component
│   │   │   │   ├── StatusBar.tsx     # Order status progress bar
│   │   │   │   └── OrderSummary.tsx  # Order totals table
│   │   │   └── index.ts              # Component exports
│   │   ├── templates/              # Email templates
│   │   │   ├── client/
│   │   │   │   ├── WelcomeEmail.tsx
│   │   │   │   ├── OrderConfirmationEmail.tsx
│   │   │   │   ├── DeliveryStatusEmail.tsx
│   │   │   │   ├── OrderPaidEmail.tsx
│   │   │   │   ├── OrderShippedEmail.tsx
│   │   │   │   └── OrderDeliveredEmail.tsx
│   │   │   ├── vendor/
│   │   │   │   ├── NewSaleEmail.tsx
│   │   │   │   └── LowStockEmail.tsx
│   │   │   └── support/
│   │   │       ├── ContactConfirmationEmail.tsx
│   │   │       └── PasswordResetEmail.tsx
│   │   ├── utils/
│   │   │   ├── renderEmail.tsx       # Email rendering utility
│   │   │   └── emailConfig.ts        # Email configuration
│   │   └── index.ts                  # Template exports
│   └── types/
│       └── email.types.ts           # TypeScript interfaces
backend/src/
├── services/
│   └── emailService.ts             # Updated email service (imports from packages/emails)
└── templates/emails/               # Legacy Handlebars (to be deprecated)
```

### 2. Component Hierarchy

#### Shared Components (components/)
- **EmailLayout**: Base wrapper with consistent styling
- **Header**: Logo and branding
- **Footer**: Contact info and unsubscribe links
- **Button**: Consistent button styling
- **ProductItem**: Product display with image and details
- **StatusBar**: Order progress visualization
- **OrderSummary**: Pricing breakdown table

#### Email Templates (templates/)
Each template extends the shared layout and includes specific content:

```
EmailLayout
├── Header
├── Content (template-specific)
│   ├── StatusBar (if applicable)
│   ├── ProductItem(s) (if applicable)
│   ├── OrderSummary (if applicable)
│   └── Custom content
└── Footer
```

### 3. Data Flow and Props Structure

#### Base Props Interface
```typescript
interface BaseEmailProps {
  recipientName: string;
  recipientEmail: string;
  frontendUrl: string;
  unsubscribeLink?: string;
}
```

#### Specific Email Props
```typescript
interface OrderConfirmationEmailProps extends BaseEmailProps {
  orderId: string;
  orderDate: string;
  paymentMethod: string;
  shippingAddress: Address;
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
}

interface DeliveryStatusEmailProps extends BaseEmailProps {
  orderId: string;
  status: DeliveryStatus;
  trackingCode?: string;
  estimatedDelivery?: string;
  deliveryLocation?: string;
  statusUpdateDate: string;
  showTrackingButton: boolean;
  isDelivered: boolean;
}
```

#### Data Transformation
- Maintain existing data structures from controllers
- Add type safety with TypeScript interfaces
- Transform data in email service before passing to components

### 4. Integration Points with emailService.js

#### Updated emailService.ts
```typescript
import { render } from '@react-email/render';
import { WelcomeEmail } from '../../../packages/emails/src/templates/client/WelcomeEmail';
// ... other imports

// New rendering function
const renderReactEmail = async (component: React.ReactElement): Promise<string> => {
  return render(component, {
    pretty: true,
  });
};

// Updated email functions
export const sendWelcomeEmail = async (userData) => {
  const component = WelcomeEmail({
    recipientName: userData.nome,
    recipientEmail: userData.email,
    frontendUrl: process.env.FRONTEND_URL,
  });

  const htmlContent = await renderReactEmail(component);
  return await sendEmail(userData.email, 'Bem-vindo ao HelpNet!', htmlContent);
};
```

#### Backward Compatibility
- Keep existing Handlebars functions during migration
- Add feature flag to switch between systems
- Gradual rollout per email type

### 5. Migration Strategy

#### Phase 1: Setup and Foundation (Week 1)
- Install React Email dependencies
- Create directory structure
- Set up Tailwind configuration for emails
- Create base layout components (EmailLayout, Header, Footer)
- Implement WelcomeEmail as proof of concept

#### Phase 2: Core Components (Week 2)
- Build shared UI components (Button, ProductItem, StatusBar)
- Migrate OrderConfirmationEmail
- Update emailService.ts with new rendering logic
- Test email rendering and delivery

#### Phase 3: Remaining Templates (Week 3)
- Migrate all remaining email templates
- Update all email service functions
- Comprehensive testing across email clients

#### Phase 4: Cleanup and Optimization (Week 4)
- Remove Handlebars dependencies
- Delete legacy templates
- Performance optimization
- Documentation updates

#### Migration Checklist
- [ ] Each email type tested in major email clients (Gmail, Outlook, Apple Mail)
- [ ] Mobile responsiveness verified
- [ ] Dark mode compatibility checked
- [ ] Accessibility standards met
- [ ] Fallback text versions included

### 6. Tailwind Configuration for Emails

#### tailwind.email.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/emails/**/*.{js,ts,jsx,tsx}",
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
}
```

#### Email-Specific Considerations
- Use `!important` sparingly, prefer component-level styling
- Test gradients and advanced CSS in email clients
- Ensure all styles are inline after rendering
- Use web-safe fonts with fallbacks

## Benefits of New Architecture

1. **Maintainability**: Component-based structure with clear separation of concerns
2. **Type Safety**: TypeScript interfaces prevent data structure errors
3. **Consistency**: Shared components ensure uniform styling
4. **Developer Experience**: React development workflow with hot reload
5. **Testing**: Easier to unit test individual components
6. **Scalability**: Easy to add new email types and modify existing ones
7. **Email Client Compatibility**: React Email handles vendor-specific quirks

## Implementation Timeline

- **Total Duration**: 4 weeks
- **Risk Mitigation**: Feature flags allow rollback if issues arise
- **Testing**: Parallel testing of both systems during migration
- **Monitoring**: Email delivery rates and open rates tracked throughout

## Next Steps

1. Review and approve this architecture design
2. Set up development environment with React Email
3. Begin implementation with Phase 1 components
4. Establish testing protocols for email rendering