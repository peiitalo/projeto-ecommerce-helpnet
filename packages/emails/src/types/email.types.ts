export interface BaseEmailProps {
  recipientName: string;
  recipientEmail: string;
  frontendUrl: string;
  unsubscribeLink?: string;
}

export interface Address {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
}

export interface Product {
  nome: string;
  imagem?: string;
  preco: number;
  quantidade: number;
}

export interface OrderConfirmationEmailProps extends BaseEmailProps {
  orderId: string;
  orderDate: string;
  paymentMethod: string;
  shippingAddress: Address;
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface DeliveryStatusEmailProps extends BaseEmailProps {
  orderId: string;
  status: DeliveryStatus;
  trackingCode?: string;
  estimatedDelivery?: string;
  deliveryLocation?: string;
  statusUpdateDate: string;
  showTrackingButton: boolean;
  isDelivered: boolean;
}

export interface OrderPaidEmailProps extends BaseEmailProps {
  orderId: string;
  paymentDate: string;
  paymentMethod: string;
  products: Product[];
  total: number;
}

export interface OrderShippedEmailProps extends BaseEmailProps {
  orderId: string;
  shippingDate: string;
  trackingCode?: string;
  carrier?: string;
  estimatedDelivery?: string;
  status: string;
  products: Product[];
  shippingAddress: Address;
  total: number;
}

export interface OrderDeliveredEmailProps extends BaseEmailProps {
  orderId: string;
  deliveryDate: string;
  receivedBy?: string;
  products: Product[];
  total: number;
}

export interface VendorNewSaleEmailProps extends BaseEmailProps {
  vendorName: string;
  orderId: string;
  orderDate: string;
  products: Product[];
  totalValue: number;
}

export interface VendorLowStockEmailProps extends BaseEmailProps {
  vendorName: string;
  productName: string;
  currentStock: number;
  recentSales: number;
}

export interface ContactConfirmationEmailProps extends BaseEmailProps {
  contactName: string;
  contactEmail: string;
  message: string;
  contactDate: string;
}

export interface PasswordResetEmailProps extends BaseEmailProps {
  resetToken: string;
  resetUrl: string;
}

export type DeliveryStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';