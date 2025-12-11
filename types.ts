import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id: string;
  user_id: string;
  type: 'Ração' | 'Medicamento' | 'Outro';
  description: string;
  cost: number;
  date: Timestamp | Date; // Allow both for Mock/Firebase compatibility
}

export interface Production {
  id: string;
  user_id: string;
  date: Timestamp | Date;
  eggs_produced: number;
  feed_consumed_kg: number;
}

export interface Sale {
  id: string;
  user_id: string;
  date: Timestamp | Date;
  quantity: number;
  value: number;
  client?: string;
}

export type ViewState = 'dashboard' | 'expenses' | 'production' | 'sales';

export interface AppContextType {
  db: any;
  auth: any;
  userId: string | null;
  isAuthReady: boolean;
  isDemoMode: boolean;
}