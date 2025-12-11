import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, PiggyBank, Egg, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Expense, Production, Sale } from '../types';

interface DashboardProps {
  expenses: Expense[];
  productionRecords: Production[];
  sales: Sale[];
}

// Helpers for date handling
const getDate = (d: any) => d.toDate ? d.toDate() : new Date(d);

export const Dashboard: React.FC<DashboardProps> = ({ expenses, productionRecords, sales }) => {
  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.value, 0);
    const totalEggs = productionRecords.reduce((sum, rec) => sum + rec.eggs_produced, 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalExpenses, totalRevenue, totalEggs, netProfit, margin };
  }, [expenses, productionRecords, sales]);

  const chartData = useMemo(() => {
    // Map dates to data objects
    const dataMap: Record<string, { dateObj: Date, dateStr: string, ovos: number, receita: number }> = {};

    const addToMap = (date: Date, type: 'ovos' | 'receita', value: number) => {
      // Normalize date to YYYY-MM-DD for key
      const key = date.toISOString().split('T')[0];
      if (!dataMap[key]) {
        dataMap[key] = {
          dateObj: date,
          dateStr: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          ovos: 0,
          receita: 0
        };
      }
      dataMap[key][type] += value;
    };

    productionRecords.forEach(rec => addToMap(getDate(rec.date), 'ovos', rec.eggs_produced));
    sales.forEach(rec => addToMap(getDate(rec.date), 'receita', rec.value));

    // Convert map to array and sort by date
    const sortedData = Object.values(dataMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(-14); // Last 14 days active

    return sortedData.map(d => ({
      date: d.dateStr,
      ovos: d.ovos,
      receita: d.receita
    }));
  }, [productionRecords, sales]);

  const expenseDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(exp => {
      map[exp.type] = (map[exp.type] || 0) + exp.cost;
    });
    return Object.keys(map).map(key => ({ name: key, value: map[key] }));
  }, [expenses]);

  const EXPENSE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(metrics.netProfit)} 
          icon={TrendingUp} 
          trend={metrics.netProfit >= 0 ? 'positive' : 'negative'}
          subtitle={`${metrics.margin.toFixed(1)}% de margem`}
        />
        <StatCard 
          title="Receita Vendas" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={DollarSign} 
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="Despesas" 
          value={formatCurrency(metrics.totalExpenses)} 
          icon={PiggyBank} 
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard 
          title="Ovos Produzidos" 
          value={metrics.totalEggs.toLocaleString('pt-BR')} 
          icon={Egg} 
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        
        {/* Production Trend */}
        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Tendência: Produção vs Vendas</h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOvos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 12}} />
                  <YAxis yAxisId="left" stroke="#9CA3AF" tick={{fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="ovos" stroke="#EAB308" fillOpacity={1} fill="url(#colorOvos)" name="Ovos (un)" />
                  <Area yAxisId="right" type="monotone" dataKey="receita" stroke="#10B981" fillOpacity={0.3} fill="url(#colorReceita)" name="Vendas (R$)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sem dados suficientes
              </div>
            )}
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Distribuição de Custos</h3>
          <div className="h-[250px] sm:h-[300px] w-full flex items-center justify-center">
            {expenseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400">Sem dados de despesas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  trend?: 'positive' | 'negative';
  subtitle?: string;
}> = ({ title, value, icon: Icon, color = "text-emerald-600", bgColor = "bg-emerald-50", trend, subtitle }) => (
  <div className="p-4 sm:p-6 transition-all duration-200 bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-xl">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    {(trend || subtitle) && (
      <div className="flex items-center mt-4 text-sm">
        {trend === 'positive' && <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-500" />}
        {trend === 'negative' && <ArrowDownRight className="w-4 h-4 mr-1 text-red-500" />}
        <span className={trend === 'positive' ? 'text-emerald-600' : trend === 'negative' ? 'text-red-600' : 'text-gray-500'}>
          {subtitle}
        </span>
      </div>
    )}
  </div>
);