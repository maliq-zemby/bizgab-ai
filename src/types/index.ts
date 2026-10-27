export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  costPrice: number; // Prix de revient unitaire en FCFA
  sellingPrice: number; // Prix de vente unitaire en FCFA
  unit: string; // ex: 'unité', 'carton', 'sac 5kg', 'bouteille', 'paquet'
  barcode?: string;
  updatedAt: string;
}

export interface SaleItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export type PaymentMethod = 'Especes' | 'AirtelMoney' | 'MoovMoney' | 'Virement' | 'Autre';

export interface Sale {
  id: string;
  date: string; // ISO format
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  grossMargin: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Approvisionnement'
  | 'Loyer'
  | 'Electricite_SEEG'
  | 'Transport'
  | 'Salaires'
  | 'Emballages'
  | 'Taxes'
  | 'Autre';

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // en FCFA
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface BusinessProfile {
  name: string;
  ownerName: string;
  city: string; // ex: 'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', etc.
  neighborhood: string; // ex: 'Mont-Bouët', 'Nzeng-Ayong', 'Oloumi', 'Glass'
  phone: string;
  isDemo: boolean;
  currency: string; // Toujours 'FCFA'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CommunityReply {
  id: string;
  author: string;
  city: string;
  content: string;
  createdAt: string;
}

export interface CommunityMessage {
  id: string;
  author: string;
  businessName: string;
  city: string;
  category: 'fournisseurs' | 'gestion' | 'alerte' | 'entraide' | 'general';
  content: string;
  createdAt: string;
  likes: number;
  replies?: CommunityReply[];
}
