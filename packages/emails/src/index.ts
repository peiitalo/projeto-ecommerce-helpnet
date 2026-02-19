// Components
export { EmailLayout } from './components/layout/EmailLayout.js';
export { Header } from './components/layout/Header.js';
export { Footer } from './components/layout/Footer.js';
export { Button } from './components/ui/Button.js';
export { ProductItem } from './components/ui/ProductItem.js';
export { StatusBar } from './components/ui/StatusBar.js';
export { OrderSummary } from './components/ui/OrderSummary.js';

// Templates
export { WelcomeEmail } from './templates/client/WelcomeEmail.js';
export { OrderConfirmationEmail } from './templates/client/OrderConfirmationEmail.js';
export { DeliveryStatusEmail } from './templates/client/DeliveryStatusEmail.js';
export { OrderPaidEmail } from './templates/client/OrderPaidEmail.js';
export { OrderShippedEmail } from './templates/client/OrderShippedEmail.js';
export { OrderDeliveredEmail } from './templates/client/OrderDeliveredEmail.js';
export { NewSaleEmail } from './templates/vendor/NewSaleEmail.js';
export { LowStockEmail } from './templates/vendor/LowStockEmail.js';
export { ContactConfirmationEmail } from './templates/support/ContactConfirmationEmail.js';
export { PasswordResetEmail } from './templates/support/PasswordResetEmail.js';

// Utils
export { renderEmail } from './utils/renderEmail.js';

// Types
export * from './types/email.types.js';