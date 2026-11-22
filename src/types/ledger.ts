export type TransactionType = 'credit_given' | 'payment_received';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType; // 'credit_given' = Udhar (You Gave), 'payment_received' = Jama (You Got)
  amount: number;
  note?: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive = customer owes shop (You'll Get / Ughrani), negative = shop owes customer
  lastTransactionDate?: string;
  avatarColor?: string;
}

export interface DailySummary {
  totalToReceive: number; // Ughrani (You'll Get)
  totalToPay: number;     // You'll Give
  todayCollected: number; // Payments collected today
  todayGiven: number;     // Credit extended today
}
