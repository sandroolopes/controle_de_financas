import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
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

  // Base filtering (Month + Search)
  const baseTransactions = transactions
    .filter(t => t.date.startsWith(filterMonth))
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Split into sections
  const incomeTransactions = baseTransactions.filter(t => t.type === 'income');
  const expenseTransactions = baseTransactions.filter(t => t.type === 'expense');

  // Calculate section totals for display headers
  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    // 'short' usually returns "dez." or "de dez". We want "05 dez"
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').replace('de ', '');
    return `${day} ${month}`;
  };

  // Helper to render flat list of cards
  const renderList = (list: Transaction[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
           <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return list.map(t => (
      <div 
        key={t.id} 
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 last:mb-0 flex items-center group hover:border-gray-200 transition-all"
        onClick={() => onEdit(t)} // Make whole card clickable for mobile ease
      >
        {/* Checkbox / Status */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleStatus(t); }}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors mr-3 ${
            t.isPaid ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-300'
          }`}
        >
           <Icons.Check size={18} />
        </button>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Title (Left) - Date (Right) */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
               <p className="font-bold text-navy-900 truncate text-sm">{t.title}</p>
               {t.isFixed && <Icons.Calendar size={10} className="text-blue-500 flex-shrink-0" />}
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0 pt-0.5">
              {formatDateShort(t.date)}
            </p>
          </div>

          {/* Row 2: Category (Left) - Value (Right) */}
          <div className="flex justify-between items-end">
            <p className="text-xs text-gray-500 truncate pr-2">{t.category}</p>
            
            <div className="flex items-center gap-2">
               {/* Actions (Visible on Desktop Hover / Mobile tap opens edit) */}
               <div className="hidden group-hover:flex items-center gap-2 mr-1">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  title="Excluir"
                 >
                   <Icons.Delete size={14} />
                 </button>
               </div>

               <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
               </span>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  // Logic to find fixed transactions from the previous month
  const pendingFixedTransactions = useMemo(() => {
    if (!onBatchAdd) return [];
    
    const [year, month] = filterMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const prevMonthFixed = transactions.filter(t => 
      t.date.startsWith(prevMonthStr) && t.isFixed
    );

    const currentMonthTx = transactions.filter(t => t.date.startsWith(filterMonth));
    
    const missing = prevMonthFixed.filter(prev => {
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
        const day = t.date.split('-')[2];
        const newDate = `${year}-${String(month).padStart(2, '0')}-${day}`;
        return {
          ...t,
          id: generateId(),
          date: newDate,
          isPaid: false 
        };
      });

      onBatchAdd(newTransactions);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
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

      {/* SECTION 1: INCOMES */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="text-emerald-600">
            <Icons.Income size={20} />
        </div>
            <h2 className="text-lg font-bold text-navy-900">Receitas</h2>
          </div>
          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        
        <div className="space-y-1">
          {renderList(incomeTransactions, "Nenhuma receita encontrada")}
        </div>
      </section>

      <hr className="border-gray-200 my-6" />

      {/* SECTION 2: EXPENSES */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="text-rose-600">
              <Icons.Expense size={20} />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Despesas</h2>
          </div>
          <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
            {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="space-y-1">
          {renderList(expenseTransactions, "Nenhuma despesa encontrada")}
        </div>
      </section>

    </div>
  );
};