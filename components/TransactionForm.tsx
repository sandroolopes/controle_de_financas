import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, CATEGORIES } from '../types';
import { generateId } from '../services/storage';
import { Icons } from './ui/Icons';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(false); // Default false: Previsto
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setTitle(initialData.title);
        setCategory(initialData.category);
        setDate(initialData.date);
        setIsPaid(initialData.isPaid);
        setIsFixed(initialData.isFixed || false);
      } else {
        // Reset defaults
        setType('expense');
        setAmount('');
        setTitle('');
        setCategory(CATEGORIES.expense[0]);
        setDate(new Date().toISOString().split('T')[0]);
        setIsPaid(false);
        setIsFixed(false);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title) return;

    const newTransaction: Transaction = {
      id: initialData ? initialData.id : generateId(),
      type,
      amount: parseFloat(amount),
      title,
      category,
      date,
      isPaid,
      isFixed
    };

    onSave(newTransaction);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-3xl p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-navy-900">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <Icons.Close size={20} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setType('income'); setCategory(CATEGORIES.income[0]); }}
            >
              Receita
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); }}
            >
              Despesa
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-lg font-bold text-navy-900"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Category */}
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-sm"
              >
                {(type === 'income' ? CATEGORIES.income : CATEGORIES.expense).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                {isPaid ? <Icons.Check size={20} /> : <Icons.Uncheck size={20} />}
              </div>
              <span className="font-semibold text-gray-700">
                {isPaid ? (type === 'income' ? 'Recebido' : 'Pago') : (type === 'income' ? 'A Receber' : 'A Pagar')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-navy-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-900"></div>
            </label>
          </div>

          {/* Fixed Transaction Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isFixed ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                <Icons.Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700">
                  Lançamento Fixo
                </span>
                <span className="text-[10px] text-gray-400">Repetir todo mês</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-navy-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-900"></div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all"
          >
            Salvar Transação
          </button>
          
          {/* Spacer for bottom safe area */}
          <div className="h-6 sm:h-0"></div>
        </form>
      </div>
    </div>
  );
};