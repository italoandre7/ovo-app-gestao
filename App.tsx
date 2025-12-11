import React, { useState, useEffect } from 'react';
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
// ConfigModal removed
import { Egg, Loader2, Info, Settings, LogIn, UserPlus, AlertCircle } from 'lucide-react';

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

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
      setExpenses(MOCK_EXPENSES);
      setProduction(MOCK_PRODUCTION);
      setSales(MOCK_SALES);
      return;
    }

    try {
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
    } catch (error) {
      console.error("Error setting up listeners:", error);
      setContext(prev => ({ ...prev, isDemoMode: true }));
    }
  }, [context.userId, context.isDemoMode, context.db]);

  // Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isRegistering) {
        await firebaseService.register(email, password);
      } else {
        await firebaseService.login(email, password);
      }
      // Auth state listener in useEffect will handle the transition
    } catch (err: any) {
      console.error(err);
      let msg = "Erro na autenticação.";
      if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
      if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
      if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      if (err.message.includes("not configured")) msg = "Banco de dados não configurado (Modo Demo indisponível para login real).";
      
      setAuthError(msg);
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setContext(prev => ({ ...prev, isDemoMode: true, userId: 'demo-user' }));
  };

  const handleLogout = async () => {
    setLoading(true);
    if (!context.isDemoMode) await firebaseService.logout();
    setContext(prev => ({ ...prev, userId: null, isDemoMode: false }));
    // Reset form state
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const handleResetConfig = () => {
    if(window.confirm("Isso limpará a configuração do banco de dados deste navegador. Continuar?")) {
      firebaseService.resetConfig();
    }
  }

  // Data Handlers (Same as before)
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

  // --- LOGIN SCREEN ---
  if (!context.userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-100 rounded-full">
                <Egg className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">OvoApp</h1>
            <p className="text-gray-500">Gestão profissional para sua produção.</p>
          </div>

          {!firebaseService.isConfigured ? (
             /* NO CONFIG STATE */
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
               <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
               <h3 className="text-yellow-800 font-semibold mb-1">Configuração Necessária</h3>
               <p className="text-yellow-700 text-sm mb-4">
                 O banco de dados não foi detectado. O login real não funcionará.
               </p>
               <Button onClick={handleDemoAccess} className="w-full">
                 Acessar Modo Demo (Offline)
               </Button>
               <p className="mt-4 text-xs text-gray-400">
                 Dica: Configure o firebase no código ou localstorage.
               </p>
             </div>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="********"
                />
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {authError}
                </div>
              )}

              <Button type="submit" className="w-full py-2.5" isLoading={loading}>
                 {isRegistering ? (
                   <><UserPlus className="w-4 h-4 mr-2" /> Criar Conta</>
                 ) : (
                   <><LogIn className="w-4 h-4 mr-2" /> Entrar</>
                 )}
              </Button>

              <div className="flex items-center justify-between text-sm mt-4">
                <button 
                  type="button" 
                  onClick={() => handleDemoAccess()}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Entrar sem conta (Demo)
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isRegistering ? 'Já tenho conta' : 'Criar nova conta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <Layout 
      view={view} 
      onNavigate={setView} 
      onLogout={handleLogout} 
      userId={context.userId}
      isDemoMode={context.isDemoMode}
    >
      <div className="flex justify-end mb-4 md:hidden">
         {!context.isDemoMode && (
           <button onClick={handleResetConfig} className="text-xs text-gray-400 hover:text-red-500 flex items-center">
             <Settings className="w-3 h-3 mr-1" /> Reset DB
           </button>
         )}
      </div>

      {view === 'dashboard' && <Dashboard expenses={expenses} productionRecords={production} sales={sales} />}
      {view === 'sales' && <Sales sales={sales} onAdd={addSale} onDelete={deleteSale} />}
      {view === 'production' && <ProductionView records={production} onAdd={addProduction} onDelete={deleteProduction} />}
      {view === 'expenses' && <Expenses expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} />}
    </Layout>
  );
}