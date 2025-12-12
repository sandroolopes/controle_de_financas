import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Icons } from './ui/Icons';
import { generateId } from '../services/storage';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (t: Transaction) => void;
  onBatchAdd?: (transactions: Transaction[]) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete, onToggleStatus, onBatchAdd }) => {
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(filterMonth))
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const groupedTransactions: Record<string, Transaction[]> = {};
  filteredTransactions.forEach(t => {
    if (!groupedTransactions[t.date]) groupedTransactions[t.date] = [];
    groupedTransactions[t.date].push(t);
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Logic to find fixed transactions from the previous month that are missing in the current month
  const pendingFixedTransactions = useMemo(() => {
    if (!onBatchAdd) return [];
    
    const [year, month] = filterMonth.split('-').map(Number);
    // Previous Month Logic
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // 1. Get fixed transactions from previous month
    const prevMonthFixed = transactions.filter(t => 
      t.date.startsWith(prevMonthStr) && t.isFixed
    );

    // 2. Check if they already exist in current filterMonth (based on title and amount)
    const currentMonthTx = transactions.filter(t => t.date.startsWith(filterMonth));
    
    const missing = prevMonthFixed.filter(prev => {
      // Check if a similar transaction exists in current month
      const exists = currentMonthTx.some(curr => 
        curr.title === prev.title && 
        curr.amount === prev.amount &&
        curr.type === prev.type
      );
      return !exists;
    });

    return missing;
  }, [transactions, filterMonth, onBatchAdd]);

  const handleImportFixed = () => {
    if (!pendingFixedTransactions.length || !onBatchAdd) return;

    if (window.confirm(`Deseja copiar ${pendingFixedTransactions.length} lançamentos fixos do mês anterior?`)) {
      const [year, month] = filterMonth.split('-').map(Number);
      
      const newTransactions = pendingFixedTransactions.map(t => {
        // Keep day, update month/year
        const day = t.date.split('-')[2];
        const newDate = `${year}-${String(month).padStart(2, '0')}-${day}`;
        
        return {
          ...t,
          id: generateId(),
          date: newDate,
          isPaid: false // Reset status to unpaid/unreceived
        };
      });

      onBatchAdd(newTransactions);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <header className="flex flex-col gap-4 mb-2">
        <h1 className="text-2xl font-bold text-navy-900">Lançamentos</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
             <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-navy-900"
            />
            <Icons.Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
           <div className="relative flex-1">
             <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-navy-900"
            />
            <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </header>
      
      {/* Import Suggestion Prompt */}
      {pendingFixedTransactions.length > 0 && (
        <button 
          onClick={handleImportFixed}
          className="w-full bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between text-blue-700 mb-2 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="bg-blue-200 p-2 rounded-full">
               <Icons.Calendar size={18} />
             </div>
             <div className="text-left">
               <p className="font-bold text-sm">Copiar Fixos ({pendingFixedTransactions.length})</p>
               <p className="text-xs opacity-80">Do mês anterior para este mês</p>
             </div>
          </div>
          <Icons.Plus size={18} />
        </button>
      )}

      <div className="space-y-6">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <Icons.List size={48} className="mb-2 opacity-20" />
             <p>Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {items.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <button 
                        onClick={() => onToggleStatus(t)}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${t.isPaid ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-300'}`}
                      >
                         <Icons.Check size={18} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-navy-900 truncate">{t.title}</p>
                           {t.isFixed && <Icons.Calendar size={12} className="text-blue-500" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{t.category}</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                      <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-navy-900">
                           <Icons.Edit size={16} />
                         </button>
                         <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-600">
                           <Icons.Delete size={16} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};