export interface Expense {
  id: string;
  user_id: string;
  type: 'Ração' | 'Medicamento' | 'Outro';
  description: string;
  cost: number;
  date: Date; // Supabase retorna strings, mas converteremos para Date no frontend
}

export interface Production {
  id: string;
  user_id: string;
  date: Date;
  eggs_produced: number;
  feed_consumed_kg: number;
}

export interface Sale {
  id: string;
  user_id: string;
  date: Date;
  quantity: number;
  value: number;
  client?: string;
}

export type ViewState = 'dashboard' | 'expenses' | 'production' | 'sales';

export interface AppContextType {
  client: any; // SupabaseClient
  userId: string | null;
  isAuthReady: boolean;
  isDemoMode: boolean;
}