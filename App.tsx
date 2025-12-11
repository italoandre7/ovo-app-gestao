import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp 
} from 'firebase/firestore';
import { firebaseService } from './services/firebaseService';
import { Expense, Production, Sale, ViewState, AppContextType } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Expenses } from './components/Expenses';
import { ProductionView } from './components/Production';
import { Sales } from './components/Sales';
import { Button } from './components/ui/Button';
import { Egg, Loader2, Info } from 'lucide-react';

// Default mock data for Demo Mode
const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: 'demo', type: 'Ração', description: 'Ração Postura Premium', cost: 150.00, date: new Date('2023-10-01') },
  { id: '2', user_id: 'demo', type: 'Medicamento', description: 'Vitaminas', cost: 45.50, date: new Date('2023-10-05') },
  { id: '3', user_id: 'demo', type: 'Outro', description: 'Reparo Cerca', cost: 80.00, date: new Date('2023-10-10') },
];

const MOCK_PRODUCTION: Production[] = [
  { id: '1', user_id: 'demo', date: new Date('2023-10-01'), eggs_produced: 120, feed_consumed_kg: 15 },
  { id: '2', user_id: 'demo', date: new Date('2023-10-02'), eggs_produced: 115, feed_consumed_kg: 14.5 },
  { id: '3', user_id: 'demo', date: new Date('2023-10-03'), eggs_produced: 130, feed_consumed_kg: 16 },
  { id: '4', user_id: 'demo', date: new Date('2023-10-04'), eggs_produced: 125, feed_consumed_kg: 15 },
];

const MOCK_SALES: Sale[] = [
  { id: '1', user_id: 'demo', date: new Date('2023-10-01'), quantity: 100, value: 80.00, client: 'Mercado A' },
  { id: '2', user_id: 'demo', date: new Date('2023-10-02'), quantity: 90, value: 72.00, client: 'Cliente Balcão' },
  { id: '3', user_id: 'demo', date: new Date('2023-10-03'), quantity: 120, value: 96.00, client: 'Mercado B' },
];

export default function App() {
  const [context, setContext] = useState<AppContextType>({
    db: firebaseService.db,
    auth: firebaseService.auth,
    userId: null,
    isAuthReady: false,
    isDemoMode: !firebaseService.isConfigured
  });
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication Effect
  useEffect(() => {
    const unsubscribe = firebaseService.initAuth((user) => {
      if (user) {
        setContext(prev => ({ ...prev, userId: user.uid, isAuthReady: true }));
      } else {
        setContext(prev => ({ ...prev, userId: null, isAuthReady: true }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Loading Effect
  useEffect(() => {
    if (!context.userId) return;

    if (context.isDemoMode) {
      // Load Mock Data
      setExpenses(MOCK_EXPENSES);
      setProduction(MOCK_PRODUCTION);
      setSales(MOCK_SALES);
      return;
    }

    // Load Firebase Data
    const expensesRef = collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/production_expenses`);
    const productionRef = collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/egg_production`);
    const salesRef = collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/sales`);

    const sortByDateDesc = (data: any[]) => {
      return data.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
        const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
        return dateB - dateA;
      });
    };

    const unsubExpenses = onSnapshot(query(expensesRef), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      setExpenses(sortByDateDesc(data));
    });

    const unsubProduction = onSnapshot(query(productionRef), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Production));
      setProduction(sortByDateDesc(data));
    });

    const unsubSales = onSnapshot(query(salesRef), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      setSales(sortByDateDesc(data));
    });

    return () => {
      unsubExpenses();
      unsubProduction();
      unsubSales();
    };
  }, [context.userId, context.isDemoMode, context.db]);

  // Handlers
  const handleLogin = async () => {
    setLoading(true);
    try {
      await firebaseService.signIn();
    } catch (e) {
      console.error(e);
      // Fallback to demo mode if auth fails (e.g. no internet/config)
      setContext(prev => ({ ...prev, isDemoMode: true, userId: 'demo-user' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!context.isDemoMode) await firebaseService.logout();
    setContext(prev => ({ ...prev, userId: null }));
  };

  // Add Data Handlers
  const addExpense = async (data: any) => {
    if (context.isDemoMode) {
      const newExp = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
      setExpenses(prev => [newExp, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    } else {
      await addDoc(collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/production_expenses`), {
        ...data,
        user_id: context.userId,
        date: Timestamp.fromDate(new Date(data.date))
      });
    }
  };

  const deleteExpense = async (id: string) => {
    if (context.isDemoMode) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    } else {
      await deleteDoc(doc(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/production_expenses`, id));
    }
  };

  const addProduction = async (data: any) => {
     if (context.isDemoMode) {
      const newProd = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
      setProduction(prev => [newProd, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    } else {
      await addDoc(collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/egg_production`), {
        ...data,
        user_id: context.userId,
        date: Timestamp.fromDate(new Date(data.date))
      });
    }
  };

  const deleteProduction = async (id: string) => {
    if (context.isDemoMode) {
      setProduction(prev => prev.filter(p => p.id !== id));
    } else {
      await deleteDoc(doc(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/egg_production`, id));
    }
  };

  const addSale = async (data: any) => {
    if (context.isDemoMode) {
     const newSale = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
     setSales(prev => [newSale, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
   } else {
     await addDoc(collection(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/sales`), {
       ...data,
       user_id: context.userId,
       date: Timestamp.fromDate(new Date(data.date))
     });
   }
 };

 const deleteSale = async (id: string) => {
   if (context.isDemoMode) {
     setSales(prev => prev.filter(p => p.id !== id));
   } else {
     await deleteDoc(doc(context.db, `artifacts/${firebaseService.appId}/users/${context.userId}/sales`, id));
   }
 };

  // Login Screen
  if (!context.userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-100 rounded-full">
              <Egg className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OvoApp</h1>
          <p className="text-gray-500">Gestão profissional para sua produção de ovos.</p>
          
          <div className="space-y-4">
             {loading ? (
                <Button className="w-full" disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...
                </Button>
             ) : (
                <Button className="w-full py-3 text-lg" onClick={handleLogin}>
                  Acessar Sistema
                </Button>
             )}
          </div>
          
          {context.isDemoMode && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-center justify-center">
              <Info className="w-4 h-4 mr-2" />
              Ambiente de Demonstração (Sem Banco de Dados)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout 
      view={view} 
      onNavigate={setView} 
      onLogout={handleLogout} 
      userId={context.userId}
      isDemoMode={context.isDemoMode}
    >
      {view === 'dashboard' && <Dashboard expenses={expenses} productionRecords={production} sales={sales} />}
      {view === 'sales' && <Sales sales={sales} onAdd={addSale} onDelete={deleteSale} />}
      {view === 'production' && <ProductionView records={production} onAdd={addProduction} onDelete={deleteProduction} />}
      {view === 'expenses' && <Expenses expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} />}
    </Layout>
  );
}