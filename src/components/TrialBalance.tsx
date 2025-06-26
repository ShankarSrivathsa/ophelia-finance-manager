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
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-purple-600';
      case 'revenue': return 'text-green-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBalanced ? 'bg-green-100' : 'bg-red-100'}`}>
          <Scale className={`w-5 h-5 ${isBalanced ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Trial Balance</h2>
          <p className={`text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            {isBalanced ? 'Books are balanced ✓' : 'Books are not balanced ⚠️'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No accounts to display. Add some transactions to see your trial balance!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Account</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-red-700">Debit</th>
                <th className="text-right py-3 px-4 font-semibold text-green-700">Credit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/55">
                  <td className="py-3 px-4 font-medium text-gray-800">{item.account}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-red-600">
                    {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">
                    {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50/55">
                <td className="py-4 px-4 font-bold text-gray-800" colSpan={2}>Total</td>
                <td className="py-4 px-4 text-right font-bold text-red-700">{formatCurrency(totalDebits)}</td>
                <td className="py-4 px-4 text-right font-bold text-green-700">{formatCurrency(totalCredits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};