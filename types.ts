export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string YYYY-MM-DD
  isPaid: boolean; // Status: Recebido/Pago vs Previsto
  isFixed?: boolean; // Lançamento Fixo / Recorrente
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  forecastBalance: number;
  incomeReceived: number;
  expensePaid: number;
}

export const CATEGORIES = {
  income: ['Salário', 'Investimentos', 'Aluguel','Freelance', 'Outros'],
  expense: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Cartão', 'Outros']
};