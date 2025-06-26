import React from 'react';
import { Layers } from 'lucide-react';
import { LedgerAccount } from '../types/accounting';
import { formatCurrency, formatDate } from '../utils/accounting';

interface LedgerAccountsProps {
  ledgerAccounts: LedgerAccount[];
}

export const LedgerAccounts: React.FC<LedgerAccountsProps> = ({ ledgerAccounts }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'asset': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'liability': return 'bg-red-50 text-red-700 border-red-200';
      case 'equity': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'revenue': return 'bg-green-50 text-green-700 border-green-200';
      case 'expense': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getBalanceColor = (balance: number, category: string) => {
    if (balance === 0) return 'text-gray-500';
    if (category === 'asset' || category === 'expense') {
      return balance > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return balance > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  if (ledgerAccounts.length === 0) {
    return (
      <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Ledger Accounts</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No accounts yet. Add some transactions to see your ledger accounts!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Ledger Accounts</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ledgerAccounts.map((account) => (
          <div key={account.name} className="border border-gray-200 rounded-lg p-4 bg-white/55">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(account.category)}`}>
                  {account.category.charAt(0).toUpperCase() + account.category.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Balance</div>
                <div className={`text-lg font-semibold ${getBalanceColor(account.balance, account.category)}`}>
                  {formatCurrency(Math.abs(account.balance))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};