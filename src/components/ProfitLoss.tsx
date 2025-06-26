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
    <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          {netIncome >= 0 ? 
            <TrendingUp className="w-5 h-5 text-green-600" /> : 
            <TrendingDown className="w-5 h-5 text-red-600" />
          }
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Profit & Loss Statement</h2>
      </div>

      <div className="space-y-6">
        {/* Revenue Section */}
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-3">Revenue</h3>
          {revenueItems.length > 0 ? (
            <div className="space-y-2">
              {revenueItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-green-50/55 rounded-lg">
                  <span className="text-gray-700">{item.account}</span>
                  <span className="font-medium text-green-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-green-100/55 rounded-lg font-semibold">
                <span className="text-green-800">Total Revenue</span>
                <span className="text-green-800">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No revenue recorded</p>
          )}
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">Expenses</h3>
          {expenseItems.length > 0 ? (
            <div className="space-y-2">
              {expenseItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-red-50/55 rounded-lg">
                  <span className="text-gray-700">{item.account}</span>
                  <span className="font-medium text-red-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-red-100/55 rounded-lg font-semibold">
                <span className="text-red-800">Total Expenses</span>
                <span className="text-red-800">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No expenses recorded</p>
          )}
        </div>

        {/* Net Income */}
        <div className={`p-4 rounded-lg border-2 ${netIncome >= 0 ? 'bg-green-50/55 border-green-200' : 'bg-red-50/55 border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Net {netIncome >= 0 ? 'Income' : 'Loss'}
            </span>
            <span className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(Math.abs(netIncome))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};