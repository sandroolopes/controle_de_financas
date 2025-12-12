import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Icons } from './ui/Icons';

interface ReportsProps {
  transactions: Transaction[];
}

export const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [year, setYear] = useState(new Date().getFullYear());

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
      income: 0,
      expense: 0,
      balance: 0
    }));

    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === year) {
        const month = d.getMonth();
        if (t.type === 'income') {
          data[month].income += t.amount;
        } else {
          data[month].expense += t.amount;
        }
      }
    });

    return data.map(d => ({
      ...d,
      balance: d.income - d.expense
    }));
  }, [transactions, year]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-navy-900">Relatórios</h1>
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
          <button 
             onClick={() => setYear(year - 1)}
             className="p-1 hover:bg-white rounded text-gray-600"
          >
             ←
          </button>
          <span className="px-3 text-sm font-bold text-navy-900">{year}</span>
          <button 
             onClick={() => setYear(year + 1)}
             className="p-1 hover:bg-white rounded text-gray-600"
          >
             →
          </button>
        </div>
      </header>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
          <Icons.Income size={16} className="text-emerald-500" /> 
          Receita vs 
          <Icons.Expense size={16} className="text-rose-500" />
          Despesa
        </h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="b" />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-6">Fluxo de Caixa Mensal</h3>
        <div className="space-y-4">
          {monthlyData.map((m, i) => (
             (m.income > 0 || m.expense > 0) && (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 pb-2">
                 <span className="font-bold text-gray-500 w-12">{m.name}</span>
                 <div className="flex-1 px-4">
                   <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${(m.income / (m.income + m.expense)) * 100}%` }} className="bg-emerald-400 h-full"></div>
                      <div style={{ width: `${(m.expense / (m.income + m.expense)) * 100}%` }} className="bg-rose-400 h-full"></div>
                   </div>
                 </div>
                 <span className={`font-bold w-20 text-right ${m.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {m.balance > 0 ? '+' : ''}{formatCurrency(m.balance)}
                 </span>
              </div>
             )
          ))}
        </div>
      </div>
    </div>
  );
};