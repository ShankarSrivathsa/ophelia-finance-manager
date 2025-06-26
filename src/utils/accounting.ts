import { Transaction, LedgerAccount, TrialBalanceItem, ProfitLossItem } from '../types/accounting';

export const ACCOUNT_CATEGORY_DESCRIPTIONS = {
  asset: 'Assets - Resources owned by the business (cash, inventory, equipment)',
  liability: 'Liabilities - Debts and obligations owed to others',
  equity: 'Equity - Owner\'s stake in the business',
  revenue: 'Revenue - Income earned from business operations',
  expense: 'Expenses - Costs incurred in business operations'
};

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function createJournalEntry(transaction: Transaction): JournalEntry {
  let debitAccount: string;
  let creditAccount: string;

  // Determine debit and credit accounts based on transaction type and category
  if (transaction.type === 'debit') {
    debitAccount = transaction.account;
    creditAccount = 'Cash/Bank';
  } else {
    debitAccount = 'Cash/Bank';
    creditAccount = transaction.account;
  }

  return {
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    debitAccount,
    creditAccount,
    amount: transaction.amount
  };
}

export function generateLedgerAccounts(transactions: Transaction[]): LedgerAccount[] {
  const accounts: { [key: string]: LedgerAccount } = {};

  transactions.forEach(transaction => {
    if (!accounts[transaction.account]) {
      accounts[transaction.account] = {
        name: transaction.account,
        category: transaction.category,
        debits: 0,
        credits: 0,
        balance: 0
      };
    }

    const account = accounts[transaction.account];
    if (transaction.type === 'debit') {
      account.debits += transaction.amount;
    } else {
      account.credits += transaction.amount;
    }

    // Calculate balance based on account type
    if (transaction.category === 'asset' || transaction.category === 'expense') {
      account.balance = account.debits - account.credits;
    } else {
      account.balance = account.credits - account.debits;
    }
  });

  return Object.values(accounts);
}

export function generateTrialBalance(ledgerAccounts: LedgerAccount[]): TrialBalanceItem[] {
  return ledgerAccounts.map(account => ({
    account: account.name,
    category: account.category,
    debit: account.balance > 0 ? account.balance : 0,
    credit: account.balance < 0 ? Math.abs(account.balance) : 0
  }));
}

export function generateProfitLoss(ledgerAccounts: LedgerAccount[]): { items: ProfitLossItem[], netIncome: number } {
  const revenueAccounts = ledgerAccounts.filter(acc => acc.category === 'revenue');
  const expenseAccounts = ledgerAccounts.filter(acc => acc.category === 'expense');

  const items: ProfitLossItem[] = [
    ...revenueAccounts.map(acc => ({
      account: acc.name,
      category: 'revenue' as const,
      amount: Math.abs(acc.balance)
    })),
    ...expenseAccounts.map(acc => ({
      account: acc.name,
      category: 'expense' as const,
      amount: Math.abs(acc.balance)
    }))
  ];

  const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const netIncome = totalRevenue - totalExpenses;

  return { items, netIncome };
}

export function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
}