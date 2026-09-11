export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  address?: string;
  status?: string;
  createdAt?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  keyword?: string;
  productCount?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
  subcategories?: string[];
}

export interface Product {
  _id: string;
  name: string;
  code: string;
  category: Category | string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  description?: string;
  specifications?: Record<string, string>;
  soldCount: number;
  rating: number;
  isFeatured: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
  image: string;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'ONLINE';

export interface Order {
  _id: string;
  orderCode: string;
  customer: User | string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  orderDate: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
