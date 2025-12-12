import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { Reports } from './components/Reports';
import { TransactionForm } from './components/TransactionForm';
import { Icons } from './components/ui/Icons';
import { Transaction } from './types';
import { getTransactions, saveTransactions } from './services/storage';

type Tab = 'dashboard' | 'transactions' | 'reports';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load data on mount
  useEffect(() => {
    const data = getTransactions();
    setTransactions(data);
  }, []);

  // Save data on change
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const handleAddTransaction = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [t, ...prev]);
    }
  };

  const handleBatchAdd = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = (t: Transaction) => {
    const updated = { ...t, isPaid: !t.isPaid };
    setTransactions(prev => prev.map(item => item.id === t.id ? updated : item));
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl overflow-hidden relative">
        
        {/* Main Content Area */}
        <main className="p-5 h-full overflow-y-auto no-scrollbar pt-8">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
          {activeTab === 'transactions' && (
            <TransactionList 
              transactions={transactions} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onBatchAdd={handleBatchAdd}
            />
          )}
          {activeTab === 'reports' && <Reports transactions={transactions} />}
        </main>

        {/* Floating Action Button (FAB) - Visible mostly on List/Dashboard */}
        <button
          onClick={handleOpenAdd}
          className="fixed bottom-24 right-6 sm:absolute sm:right-6 sm:bottom-24 z-30 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          aria-label="Adicionar"
        >
          <Icons.Plus size={28} />
        </button>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center h-16 pb-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'dashboard' ? 'text-navy-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icons.Dashboard size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Início</span>
            </button>

            <button 
              onClick={() => setActiveTab('transactions')}
              className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'transactions' ? 'text-navy-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icons.List size={24} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Extrato</span>
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'reports' ? 'text-navy-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icons.Reports size={24} strokeWidth={activeTab === 'reports' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Análise</span>
            </button>
          </div>
        </nav>

        {/* Modal Form */}
        <TransactionForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleAddTransaction}
          initialData={editingTransaction}
        />
        
      </div>
    </div>
  );
};

export default App;