import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ProfitLossItem } from '../types/accounting';
import { formatCurrency } from '../utils/accounting';

interface ProfitLossProps {
  items: ProfitLossItem[];
  netIncome: number;
}

export const ProfitLoss: React.FC<ProfitLossProps> = ({ items, netIncome }) => {
  const revenueItems = items.filter(item => item.category === 'revenue');
  const expenseItems = items.filter(item => item.category === 'expense');
  
  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netIncome >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
          {netIncome >= 0 ? 
            <TrendingUp className="w-5 h-5 text-white" /> : 
            <TrendingDown className="w-5 h-5 text-white" />
          }
        </div>
        <h2 className="text-xl font-semibold text-white">Profit & Loss Statement</h2>
      </div>

      <div className="space-y-6">
        {/* Revenue Section */}
        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-3">Revenue</h3>
          {revenueItems.length > 0 ? (
            <div className="space-y-2">
              {revenueItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-green-900/50 rounded-lg">
                  <span className="text-gray-300">{item.account}</span>
                  <span className="font-medium text-green-300">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-green-800/50 rounded-lg font-semibold">
                <span className="text-white">Total Revenue</span>
                <span className="text-white">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 italic">No revenue recorded</p>
          )}
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-3">Expenses</h3>
          {expenseItems.length > 0 ? (
            <div className="space-y-2">
              {expenseItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-red-900/50 rounded-lg">
                  <span className="text-gray-300">{item.account}</span>
                  <span className="font-medium text-red-300">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-red-800/50 rounded-lg font-semibold">
                <span className="text-white">Total Expenses</span>
                <span className="text-white">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 italic">No expenses recorded</p>
          )}
        </div>

        {/* Net Income */}
        <div className={`p-4 rounded-lg border-2 ${netIncome >= 0 ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              Net {netIncome >= 0 ? 'Income' : 'Loss'}
            </span>
            <span className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(Math.abs(netIncome))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};