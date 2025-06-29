import React from 'react';
import { Scale } from 'lucide-react';
import { TrialBalanceItem } from '../types/accounting';
import { formatCurrency } from '../utils/accounting';

interface TrialBalanceProps {
  items: TrialBalanceItem[];
}

export const TrialBalance: React.FC<TrialBalanceProps> = ({ items }) => {
  const totalDebits = items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredits = items.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'asset': return 'text-blue-300';
      case 'liability': return 'text-red-300';
      case 'equity': return 'text-purple-300';
      case 'revenue': return 'text-green-300';
      case 'expense': return 'text-orange-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBalanced ? 'bg-green-600' : 'bg-red-600'}`}>
          <Scale className={`w-5 h-5 text-white`} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Trial Balance</h2>
          <p className={`text-sm ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
            {isBalanced ? 'Books are balanced ✓' : 'Books are not balanced ⚠️'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No accounts to display. Add some transactions to see your trial balance!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#2C2C2E]">
                <th className="text-left py-3 px-4 font-semibold text-white">Account</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-red-400">Debit</th>
                <th className="text-right py-3 px-4 font-semibold text-green-400">Credit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-[#2C2C2E] hover:bg-[#2C2C2E]">
                  <td className="py-3 px-4 font-medium text-white">{item.account}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-red-400">
                    {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-400">
                    {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2C2C2E] bg-[#2C2C2E]">
                <td className="py-4 px-4 font-bold text-white" colSpan={2}>Total</td>
                <td className="py-4 px-4 text-right font-bold text-red-400">{formatCurrency(totalDebits)}</td>
                <td className="py-4 px-4 text-right font-bold text-green-400">{formatCurrency(totalCredits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};