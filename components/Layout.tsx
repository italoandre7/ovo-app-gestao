import React, { useState } from 'react';
import { Home, PiggyBank, Egg, LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  view: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  userId: string | null;
  isDemoMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, onNavigate, onLogout, userId, isDemoMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sales', label: 'Vendas', icon: ShoppingBag },
    { id: 'production', label: 'Produção', icon: Egg },
    { id: 'expenses', label: 'Despesas', icon: PiggyBank },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-900 text-white fixed h-full z-10">
        <div className="p-6 flex items-center justify-center border-b border-emerald-800">
          <Egg className="w-8 h-8 text-yellow-400 mr-2" />
          <h1 className="text-xl font-bold tracking-tight">OvoApp</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                ${view === item.id 
                  ? 'bg-emerald-800 text-white shadow-lg' 
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-800">
           {isDemoMode && (
             <div className="mb-4 px-4 py-2 bg-yellow-500/20 rounded text-xs text-yellow-200 border border-yellow-500/30">
               Modo Demo (Dados Locais)
             </div>
           )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-emerald-900 text-white z-20 flex justify-between items-center p-4">
        <div className="flex items-center">
          <Egg className="w-6 h-6 text-yellow-400 mr-2" />
          <h1 className="text-lg font-bold">OvoApp</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-emerald-900 pt-20 px-4 md:hidden">
           <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-4 text-base font-medium rounded-lg
                  ${view === item.id 
                    ? 'bg-emerald-800 text-white' 
                    : 'text-emerald-100'}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
             <button 
              onClick={onLogout}
              className="w-full flex items-center px-4 py-4 text-base text-emerald-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};