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
      case 'asset': return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'liability': return 'bg-red-900/50 text-red-300 border-red-700';
      case 'equity': return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'revenue': return 'bg-green-900/50 text-green-300 border-green-700';
      case 'expense': return 'bg-orange-900/50 text-orange-300 border-orange-700';
      default: return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const getBalanceColor = (balance: number, category: string) => {
    if (balance === 0) return 'text-gray-400';
    if (category === 'asset' || category === 'expense') {
      return balance > 0 ? 'text-green-400' : 'text-red-400';
    } else {
      return balance > 0 ? 'text-green-400' : 'text-red-400';
    }
  };

  if (ledgerAccounts.length === 0) {
    return (
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-white">Ledger Accounts</h2>
        </div>
        <p className="text-gray-400 text-center py-8">No accounts yet. Add some transactions to see your ledger accounts!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-xl font-semibold text-white">Ledger Accounts</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ledgerAccounts.map((account) => (
          <div key={account.name} className="border border-[#2C2C2E] rounded-lg p-4 bg-[#2C2C2E]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(account.category)}`}>
                  {account.category.charAt(0).toUpperCase() + account.category.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Balance</div>
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