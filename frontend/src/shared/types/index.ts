export interface User {
  _id: string;
  name: string;
  email?: string;
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

export interface ColorItem {
  _id: string;
  name: string;
  code: string;
  hexCode: string;
  description?: string;
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetOptionItem {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SizeItem {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface ProductSellingOption {
  name: string;
  price: number;
}

export interface ProductSize {
  name: string;
  price: number;
  salePrice?: number;
  stock?: number;
  sku?: string;
  optionPrices?: Record<string, number>;
}

export interface Product {
  _id: string;
  name: string;
  code: string;
  category: Category | string;
  subcategory?: string;
  price: number;
  salePrice?: number;
  stock: number;
  sellingOptions?: ProductSellingOption[];
  sizes?: ProductSize[];
  colors?: string[];
  images: string[];
  image?: string;
  description?: string;
  specifications?: Record<string, string>;
  soldCount: number;
  rating: number;
  isFeatured: boolean;
  isPinned?: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  productCode?: string;
  name: string;
  sellingOption?: string;
  size?: string;
  color?: string;
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

export type OrderStatus =
  | 'PENDING'
  | 'SHIPPING_TO_VN'
  | 'IN_VN_WAREHOUSE'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'FAILED'
  | string;
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
  adminNote?: string;
  orderDate: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ImportItem {
  product?: string | Product;
  productCode?: string;
  productName: string;
  productImage?: string;
  size?: string;
  color?: string;
  quantity: number;
  importPrice: number;
  total: number;
}

export type ImportStatus =
  | 'ORDERED'
  | 'KHO_TRUNG'
  | 'KHO_VIET'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;

export interface ImportReceipt {
  _id: string;
  importCode: string;
  orderName?: string;
  productCode?: string;
  image?: string;
  supplier: string;
  items: ImportItem[];
  totalQuantity: number;
  totalAmount: number;
  note?: string;
  status: ImportStatus;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportItemDto {
  product?: string;
  productCode?: string;
  productName: string;
  productImage?: string;
  size?: string;
  color?: string;
  quantity: number;
  importPrice: number;
}

export interface CreateImportDto {
  orderName?: string;
  productCode?: string;
  image?: string;
  quantity?: number;
  totalAmount?: number;
  supplier?: string;
  productId?: string;
  size?: string;
  items?: CreateImportItemDto[];
  note?: string;
  status?: ImportStatus;
}

