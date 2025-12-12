import React, { useMemo } from 'react';
import { Transaction, SummaryStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend, YAxis } from 'recharts';
import { Icons } from './ui/Icons';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
const GREEN = '#10b981';
const RED = '#f43f5e';

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter for current month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const stats: SummaryStats = useMemo(() => {
    let income = 0, expense = 0, incomeReceived = 0, expensePaid = 0;

    monthlyTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
        if (t.isPaid) incomeReceived += t.amount;
      } else {
        expense += t.amount;
        if (t.isPaid) expensePaid += t.amount;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: incomeReceived - expensePaid, // Real Balance
      forecastBalance: income - expense, // Forecast
      incomeReceived,
      expensePaid
    };
  }, [monthlyTransactions]);

  // Alerts logic
  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const activeAlerts: Array<{ id: string, message: string, severity: 'danger' | 'warning' }> = [];

    transactions.forEach(t => {
       if (t.type === 'expense' && !t.isPaid) {
         const tDate = new Date(t.date + 'T00:00:00');
         tDate.setHours(0,0,0,0);
         
         if (tDate < today) {
           activeAlerts.push({
             id: t.id,
             message: `"${t.title}" venceu em ${tDate.toLocaleDateString('pt-BR')}`,
             severity: 'danger'
           });
         } else if (tDate <= threeDaysFromNow) {
            activeAlerts.push({
             id: t.id,
             message: `"${t.title}" vence dia ${tDate.toLocaleDateString('pt-BR')}`,
             severity: 'warning'
           });
         }
       }
    });

    return activeAlerts.slice(0, 3); // Show max 3 alerts
  }, [transactions]);


  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions]);

  const compareData = [
    { name: 'Receita', value: stats.totalIncome },
    { name: 'Despesa', value: stats.totalExpense }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <header className="mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center shadow-lg shadow-navy-900/20">
               <Icons.Logo className="text-emerald-400" size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-navy-900 leading-tight">Visão Geral</h1>
               <p className="text-sm text-gray-500 capitalize">
                 {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
               </p>
             </div>
          </div>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${
                alert.severity === 'danger' 
                ? 'bg-red-50 text-red-700 border border-red-100' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
              }`}
            >
               <Icons.Calendar size={18} className={alert.severity === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
               {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-navy-900"></span>
            Saldo Real
          </div>
          <div>
            <span className={`text-xl font-bold ${stats.balance >= 0 ? 'text-navy-900' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </span>
            <p className="text-xs text-gray-400 mt-1">Efetivado</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            Previsão
          </div>
          <div>
            <span className={`text-xl font-bold ${stats.forecastBalance >= 0 ? 'text-gray-700' : 'text-red-400'}`}>
              {formatCurrency(stats.forecastBalance)}
            </span>
            <p className="text-xs text-gray-400 mt-1">Final do mês</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Icons.Income size={16} />
            <span className="text-sm font-semibold">Receitas</span>
          </div>
          <p className="text-lg font-bold text-emerald-800">{formatCurrency(stats.totalIncome)}</p>
          <p className="text-xs text-emerald-600 mt-1">
             {((stats.incomeReceived / (stats.totalIncome || 1)) * 100).toFixed(0)}% Recebido
          </p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
          <div className="flex items-center gap-2 text-rose-700 mb-2">
            <Icons.Expense size={16} />
            <span className="text-sm font-semibold">Despesas</span>
          </div>
          <p className="text-lg font-bold text-rose-800">{formatCurrency(stats.totalExpense)}</p>
          <p className="text-xs text-rose-600 mt-1">
            {((stats.expensePaid / (stats.totalExpense || 1)) * 100).toFixed(0)}% Pago
          </p>
        </div>
      </div>

      {/* Charts - Reordered */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Receita vs Despesa</h3>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={compareData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {compareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? GREEN : RED} />
                  ))}
                </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Despesas por Categoria</h3>
        <div className="h-64 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Sem dados de despesas
            </div>
          )}
        </div>
      </div>

    </div>
  );
};