import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'annual' | 'about'>('none');
  const menuRef = useRef<HTMLDivElement>(null);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Annual Report Data Logic
  const annualReportData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      monthName: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
      income: 0,
      expense: 0
    }));

    let totalYearIncome = 0;
    let totalYearExpense = 0;

    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      // Filter only for current year and only PAID/RECEIVED transactions
      if (d.getFullYear() === currentYear && t.isPaid) {
        const month = d.getMonth();
        if (t.type === 'income') {
          data[month].income += t.amount;
          totalYearIncome += t.amount;
        } else {
          data[month].expense += t.amount;
          totalYearExpense += t.amount;
        }
      }
    });

    return { monthly: data, totalYearIncome, totalYearExpense };
  }, [transactions, currentYear]);

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

  const closeModal = () => {
    setActiveModal('none');
    setIsMenuOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      {/* Header */}
      <header className="mb-6 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center shadow-lg shadow-navy-900/20">
               <Icons.Logo className="text-emerald-400" size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-navy-900 leading-tight">GestorX</h1>
               <p className="text-sm text-gray-500 capitalize">
                 {new Date().toLocaleString('pt-BR', { month: 'long' })} {new Date().getFullYear()}
               </p>
             </div>
          </div>
          
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -mr-2 text-gray-400 hover:text-navy-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <Icons.Menu size={24} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <button 
                  onClick={() => setActiveModal('annual')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icons.Report size={18} className="text-navy-900" />
                  Relatório anual
                </button>
                <div className="h-px bg-gray-100 mx-2"></div>
                <button 
                   onClick={() => setActiveModal('about')}
                   className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icons.Info size={18} className="text-navy-900" />
                  Sobre
                </button>
              </div>
            )}
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
            Saldo Atual
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

      {/* MODALS */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           
           {/* Modal Container */}
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-navy-900">
                  {activeModal === 'annual' ? `Relatório Anual ${currentYear}` : 'Sobre'}
                </h2>
                <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                  <Icons.Close size={20} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-5 overflow-y-auto">
                
                {/* ABOUT CONTENT */}
                {activeModal === 'about' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-navy-900/20">
                      <Icons.Logo className="text-emerald-400" size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-1">GestorX</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">Versão 1.0.0</p>
                    
                    <p className="text-gray-600 leading-relaxed text-sm">
                      O GestorX é um aplicativo de gestão financeira desenvolvido com o apoio do Google AI Studio e do ChatGPT, com o objetivo de ajudar no controle de receitas, despesas e organização financeira.
                    </p>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-xs text-gray-400">© {currentYear} GestorX</p>
                    </div>
                  </div>
                )}

                {/* ANNUAL REPORT CONTENT */}
                {activeModal === 'annual' && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase">Total Receitas</p>
                        <p className="text-base font-bold text-emerald-800">{formatCurrency(annualReportData.totalYearIncome)}</p>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                        <p className="text-xs font-semibold text-rose-600 mb-1 uppercase">Total Despesas</p>
                        <p className="text-base font-bold text-rose-800">{formatCurrency(annualReportData.totalYearExpense)}</p>
                      </div>
                    </div>
                    
                    {/* Month List */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalhamento Mensal</h3>
                      <div className="space-y-3">
                        {annualReportData.monthly.map((m, idx) => (
                          (m.income > 0 || m.expense > 0) ? (
                            <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                               <span className="font-bold text-navy-900 capitalize w-20 text-sm">{m.monthName}</span>
                               <div className="text-right flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <Icons.Income size={12} />
                                    {formatCurrency(m.income)}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                                    <Icons.Expense size={12} />
                                    {formatCurrency(m.expense)}
                                  </div>
                               </div>
                            </div>
                          ) : null
                        ))}
                         {annualReportData.totalYearIncome === 0 && annualReportData.totalYearExpense === 0 && (
                           <p className="text-center text-gray-400 text-sm py-4">Nenhum registro efetivado neste ano.</p>
                         )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
           </div>
        </div>
      )}

    </div>
  );
};