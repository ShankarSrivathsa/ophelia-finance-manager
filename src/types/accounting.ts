export interface Transaction {
  id: string;
  date: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  account: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export interface LedgerAccount {
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  transactions: Transaction[];
  balance: number;
}

export interface TrialBalanceItem {
  account: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
}

export interface ProfitLossItem {
  account: string;
  amount: number;
  type: 'revenue' | 'expense';
}