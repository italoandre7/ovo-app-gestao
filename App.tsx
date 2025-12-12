import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from './services/supabaseService';
import { Expense, Production, Sale, ViewState, AppContextType } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Expenses } from './components/Expenses';
import { ProductionView } from './components/Production';
import { Sales } from './components/Sales';
import { Button } from './components/ui/Button';
import { Egg, Loader2, Info, Settings, LogIn, UserPlus, AlertCircle, Database } from 'lucide-react';
import { Modal } from './components/ui/Modal';

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: 'demo', type: 'Ração', description: 'Ração Postura Premium', cost: 150.00, date: new Date('2023-10-01') },
  { id: '2', user_id: 'demo', type: 'Medicamento', description: 'Vitaminas', cost: 45.50, date: new Date('2023-10-05') },
  { id: '3', user_id: 'demo', type: 'Outro', description: 'Reparo Cerca', cost: 80.00, date: new Date('2023-10-10') },
];
const MOCK_PRODUCTION: Production[] = [
  { id: '1', user_id: 'demo', date: new Date('2023-10-01'), eggs_produced: 120, feed_consumed_kg: 15 },
  { id: '2', user_id: 'demo', date: new Date('2023-10-02'), eggs_produced: 115, feed_consumed_kg: 14.5 },
];
const MOCK_SALES: Sale[] = [
  { id: '1', user_id: 'demo', date: new Date('2023-10-01'), quantity: 100, value: 80.00, client: 'Mercado A' },
  { id: '2', user_id: 'demo', date: new Date('2023-10-02'), quantity: 90, value: 72.00, client: 'Cliente Balcão' },
];

export default function App() {
  const [context, setContext] = useState<AppContextType>({
    client: supabaseService.client,
    userId: null,
    isAuthReady: false,
    isDemoMode: !supabaseService.isConfigured
  });
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Login/Config State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configJson, setConfigJson] = useState('');

  // 1. Auth Init
  useEffect(() => {
    const { unsubscribe } = supabaseService.initAuth((user) => {
      setContext(prev => ({ 
        ...prev, 
        userId: user ? user.id : null, 
        isAuthReady: true,
        // If we have a user, we are definitely not in demo mode (unless forced)
        isDemoMode: !supabaseService.isConfigured 
      }));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  const fetchData = useCallback(async () => {
    if (!context.userId || context.isDemoMode || !supabaseService.client) return;

    try {
      setLoading(true);
      const supabase = supabaseService.client;

      // Parallel fetching
      const [expRes, prodRes, salesRes] = await Promise.all([
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('egg_production').select('*').order('date', { ascending: false }),
        supabase.from('sales').select('*').order('date', { ascending: false })
      ]);

      if (expRes.error) throw expRes.error;
      if (prodRes.error) throw prodRes.error;
      if (salesRes.error) throw salesRes.error;

      // Normalize dates (Supabase sends strings)
      setExpenses(expRes.data.map((d: any) => ({ ...d, date: new Date(d.date) })));
      setProduction(prodRes.data.map((d: any) => ({ ...d, date: new Date(d.date) })));
      setSales(salesRes.data.map((d: any) => ({ ...d, date: new Date(d.date) })));

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      alert("Erro ao buscar dados. Verifique se você rodou o Script SQL no Supabase.");
    } finally {
      setLoading(false);
    }
  }, [context.userId, context.isDemoMode]);

  useEffect(() => {
    if (context.userId && !context.isDemoMode) {
      fetchData();
    } else if (context.isDemoMode) {
      setExpenses(MOCK_EXPENSES);
      setProduction(MOCK_PRODUCTION);
      setSales(MOCK_SALES);
      setLoading(false);
    }
  }, [context.userId, context.isDemoMode, fetchData]);

  // Auth Actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isRegistering) {
        await supabaseService.register(email, password);
        alert("Cadastro realizado! Verifique seu e-mail para confirmar a conta (se configurado) ou faça login.");
        setIsRegistering(false); // Switch to login
      } else {
        await supabaseService.login(email, password);
      }
    } catch (err: any) {
      console.error("Supabase Auth Error:", err);
      let msg = err.message || "Erro na autenticação";
      if (msg.includes("Invalid login")) msg = "Email ou senha incorretos.";
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    if (!context.isDemoMode) await supabaseService.logout();
    setContext(prev => ({ ...prev, userId: null }));
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  // CRUD Actions
  const addExpense = async (data: any) => {
    if (context.isDemoMode) {
      const newExp = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
      setExpenses(prev => [newExp, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
      return;
    }
    const supabase = supabaseService.client;
    // Insert and ignore return (or select single). For simplicity, we refetch or push optimistically
    const { error } = await supabase.from('expenses').insert([{
      user_id: context.userId,
      type: data.type,
      description: data.description,
      cost: data.cost,
      date: data.date // Send string YYYY-MM-DD
    }]);

    if (error) { alert("Erro ao salvar: " + error.message); return; }
    fetchData(); // Refresh data
  };

  const deleteExpense = async (id: string) => {
    if (context.isDemoMode) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      return;
    }
    const { error } = await supabaseService.client.from('expenses').delete().eq('id', id);
    if (error) { alert("Erro ao excluir"); return; }
    fetchData();
  };

  const addProduction = async (data: any) => {
     if (context.isDemoMode) {
      const newProd = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
      setProduction(prev => [newProd, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
      return;
    }
    const { error } = await supabaseService.client.from('egg_production').insert([{
      user_id: context.userId,
      date: data.date,
      eggs_produced: data.eggs_produced,
      feed_consumed_kg: data.feed_consumed_kg
    }]);
    if (error) { alert("Erro: " + error.message); return; }
    fetchData();
  };

  const deleteProduction = async (id: string) => {
    if (context.isDemoMode) {
      setProduction(prev => prev.filter(p => p.id !== id));
      return;
    }
    await supabaseService.client.from('egg_production').delete().eq('id', id);
    fetchData();
  };

  const addSale = async (data: any) => {
    if (context.isDemoMode) {
     const newSale = { ...data, id: Math.random().toString(), user_id: 'demo', date: new Date(data.date) };
     setSales(prev => [newSale, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
     return;
   }
   const { error } = await supabaseService.client.from('sales').insert([{
     user_id: context.userId,
     date: data.date,
     quantity: data.quantity,
     value: data.value,
     client: data.client
   }]);
   if (error) { alert("Erro: " + error.message); return; }
   fetchData();
 };

 const deleteSale = async (id: string) => {
   if (context.isDemoMode) {
     setSales(prev => prev.filter(p => p.id !== id));
     return;
   }
   await supabaseService.client.from('sales').delete().eq('id', id);
   fetchData();
 };

  const handleSaveConfig = () => {
    try {
      supabaseService.saveConfig(configJson);
      setShowConfigModal(false);
    } catch(e: any) {
      alert(e.message);
    }
  };

  // --- RENDER ---

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
            <h1 className="text-3xl font-bold text-gray-900">OvoApp (Supabase)</h1>
            <p className="text-gray-500">Gestão profissional para sua produção.</p>
          </div>

          {!supabaseService.isConfigured ? (
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
               <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
               <h3 className="text-blue-800 font-semibold mb-1">Conectar ao Supabase</h3>
               <p className="text-blue-700 text-sm mb-4">
                 Configure sua URL e Chave Pública (Anon Key) para começar.
               </p>
               <Button onClick={() => setShowConfigModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 mb-2">
                 Configurar Supabase
               </Button>
               <Button onClick={() => setContext(prev => ({...prev, isDemoMode: true, userId: 'demo'}))} variant="secondary" className="w-full">
                 Modo Demo (Offline)
               </Button>
             </div>
          ) : (
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
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <Button type="submit" className="w-full py-2.5" isLoading={loading}>
                 {isRegistering ? (
                   <><UserPlus className="w-4 h-4 mr-2" /> Cadastrar</>
                 ) : (
                   <><LogIn className="w-4 h-4 mr-2" /> Entrar</>
                 )}
              </Button>

              <div className="flex items-center justify-between text-sm mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(true)}
                  className="text-gray-400 hover:text-gray-600 text-xs flex items-center"
                >
                  <Settings className="w-3 h-3 mr-1" /> Config
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

        {/* Config Modal */}
        <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configuração Supabase">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Copie as credenciais do seu projeto Supabase (Project Settings > API).</p>
            <textarea
              className="w-full h-32 p-2 border rounded text-xs font-mono bg-gray-50"
              placeholder='{"url": "https://...", "key": "eyJ..."}'
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
            />
             <div className="flex justify-end gap-2">
               <Button variant="secondary" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
               <Button onClick={handleSaveConfig}>Salvar</Button>
             </div>
          </div>
        </Modal>
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
      <div className="flex justify-end mb-4 md:hidden">
         {!context.isDemoMode && (
           <button onClick={() => supabaseService.resetConfig()} className="text-xs text-gray-400 hover:text-red-500 flex items-center">
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