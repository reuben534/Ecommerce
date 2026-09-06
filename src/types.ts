export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  size?: string;
  color?: string;
  stock?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string | null;
  images: string; // JSON string or parsed array
  category: string;
  subcategory?: string | null;
  brand: string;
  variants: string; // JSON string or parsed array
  sizes: string; // JSON string or parsed array
  colors: string; // JSON string or parsed array
  stock: number;
  lowStockThreshold: number;
  specifications: string; // JSON string or parsed object
  tags: string; // JSON string or parsed array
  isFeatured: boolean;
  isBestseller: boolean;
  rating: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface CartItem {
  id: number;
  productId: number;
  variantId?: string | null;
  variantLabel?: string | null;
  quantity: number;
  price: number;
  lineTotal: number;
  name: string;
  slug: string;
  image: string;
  stock: number;
  isOutOfStock: boolean;
}

export interface CartState {
  cartId: number;
  sessionToken?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  appliedCoupon?: {
    code: string;
    description: string;
    discount: number;
  } | null;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
}

export interface WishlistItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string;
  stock: number;
  isOutOfStock: boolean;
  category: string;
  rating: number;
  addedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  lowStockCount: number;
  salesChart: { date: string; revenue: number }[];
}

export interface Address {
  id: number;
  userId?: number | null;
  userUid?: string;
  fullName: string;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  orderId?: number;
  productId: number;
  name?: string;
  productName?: string;
  image?: string;
  productImage?: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
  variantInfo?: string | null;
  quantity: number;
  price: string | number;
  total?: string | number;
  lineTotal?: string | number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId?: number | null;
  userUid?: string | null;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string | null;
  shippingAddress: any;
  shippingAddressParsed?: any;
  billingAddress?: string | null;
  subtotal: string | number;
  discount: string | number;
  shippingCost?: string | number;
  tax: string | number;
  total: string | number;
  couponCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentIntentId?: string | null;
  status: OrderStatus;
  orderStatus?: string;
  carrier?: string | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  productId: number;
  productName?: string;
  userId?: number | null;
  userUid: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount?: string | null;
  maxDiscount?: string | null;
  expirationDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string | null;
  orderCount: number;
  addressCount: number;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  announcementBar: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerImage?: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingThreshold: string;
  currency: string;
  currencySymbol: string;
  [key: string]: any;
}
