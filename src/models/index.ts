export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'barber' | 'gerente' | 'admin' | 'owner' | 'superadmin';
  companyId?: string;
  barberId?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface AppointmentProductItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  barberId: string; // or 'none' / 'no-preference'
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cancellationReason?: string;
  paymentMethod: 'debit' | 'mbway' | 'cash' | 'multibanco' | 'local' | 'card' | 'transfer' | 'loyalty';
  paymentStatus: 'pending' | 'paid';
  branch: 'PT' | 'ES';
  barbershopId?: string;
  selectedProducts?: AppointmentProductItem[];
  quietService?: boolean;
  notes?: string;
  totalAmount?: number;
  // Barber Dynamic Commission fields (Firestore persisted)
  commission_rate?: number; // 55% Seg-Sáb, 70% Dom, 0% Dono
  commission_amount?: number; // Valor calculado em Euros
  barber_id?: string;
  // Manager checkout / Front-desk metadata
  customerName?: string;
  customerPhone?: string;
  closedBy?: string;
  closedAt?: number;
  isWalkIn?: boolean;
  createdAt: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category?: string;
  imageUrl?: string;
  companyId?: string;
  isActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'cabelo' | 'barba' | 'tratamento' | 'acessorio';
  imageUrl?: string;
  stock: number;
  isActive?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string;
  rating: number;
  isActive: boolean;
  branch: 'PT' | 'ES' | 'BOTH';
  compensationType: 'salary' | 'percentage';
  compensationValue: number;
  companyId?: string;
  isOwner?: boolean;
}

export interface LoyaltyPoint {
  customerId: string;
  points: number;
  updatedAt: number;
}

export interface BlockedTime {
  id: string;
  barberId: string; // 'all' for all barbers
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reason: string;
  createdAt: number;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  nif: string;
  address: string;
  phone: string;
  ownerName: string;
  updatedAt: number;
}

export interface CashFlowTransaction {
  id: string;
  barbershopId: string;
  type: 'income' | 'expense';
  category: 'service' | 'product' | 'commission' | 'rent' | 'supplies' | 'marketing' | 'utilities' | 'withdrawal' | 'other';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'mbway' | 'card' | 'transfer' | 'multibanco' | 'loyalty';
  appointmentId?: string;
  barberId?: string;
  barberName?: string;
  commissionRate?: number;
  createdAt: number;
}

export interface SaaSBarbershop {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  unit: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  plan: 'starter' | 'pro' | 'imperio';
  planStatus: 'active' | 'trial' | 'past_due';
  trialDaysLeft: number;
  monthlyFee: number;
  rating: number;
  logoUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  storyText?: string;
  quietServiceEnabled: boolean;
  cashFlowBalance: number;
  active?: boolean;
  closingTime?: string;
  openingHours?: string;
}

export interface SaaSPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxBarbers: number;
  features: string[];
  popular?: boolean;
}

