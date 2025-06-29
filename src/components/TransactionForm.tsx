import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Info } from 'lucide-react';
import { Transaction } from '../types/accounting';
import { ACCOUNT_CATEGORY_DESCRIPTIONS } from '../utils/accounting';
import { getAllAccountSuggestions } from '../services/financeService';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'debit' as 'debit' | 'credit',
    amount: '',
    description: '',
    account: '',
    category: 'expense' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [accountSuggestions, setAccountSuggestions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadAccountSuggestions();
  }, []);

  const loadAccountSuggestions = async () => {
    const suggestions = await getAllAccountSuggestions();
    setAccountSuggestions(suggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.account) return;

    onAddTransaction({
      date: formData.date,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      account: formData.account,
      category: formData.category
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'debit',
      amount: '',
      description: '',
      account: '',
      category: 'expense'
    });
  };

  const getSuggestions = () => {
    const categorySuggestions = accountSuggestions[formData.category] || [];
    return categorySuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(formData.account.toLowerCase())
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'asset': return 'text-blue-300 bg-blue-900/50 border-blue-700';
      case 'liability': return 'text-red-300 bg-red-900/50 border-red-700';
      case 'equity': return 'text-purple-300 bg-purple-900/50 border-purple-700';
      case 'revenue': return 'text-green-300 bg-green-900/50 border-green-700';
      case 'expense': return 'text-orange-300 bg-orange-900/50 border-orange-700';
      default: return 'text-gray-300 bg-gray-900/50 border-gray-700';
    }
  };

  return (
    <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
            >
              <option value="debit">Money Out (Debit)</option>
              <option value="credit">Money In (Credit)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What was this transaction for?"
            className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              category: e.target.value as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
              account: '' // Clear account when category changes
            }))}
            className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
          >
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
          </select>
          
          {/* Category Description */}
          <div className={`mt-2 p-3 rounded-lg border ${getCategoryColor(formData.category)}`}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">
                  {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                </div>
                <div className="text-sm opacity-90">
                  {ACCOUNT_CATEGORY_DESCRIPTIONS[formData.category]}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-white mb-2">Account</label>
          <input
            type="text"
            value={formData.account}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, account: e.target.value }));
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={`e.g., ${accountSuggestions[formData.category]?.[0] || 'Account name'}`}
            className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
          />
          
          {showSuggestions && formData.account && getSuggestions().length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#1F1F1F] backdrop-blur-sm border border-[#2C2C2E] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {getSuggestions().map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, account: suggestion }));
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2C2C2E] focus:bg-[#2C2C2E] focus:outline-none text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {/* Show all suggestions for the selected category when no input */}
          {showSuggestions && !formData.account && accountSuggestions[formData.category] && (
            <div className="absolute z-10 w-full mt-1 bg-[#1F1F1F] backdrop-blur-sm border border-[#2C2C2E] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-medium text-gray-400 bg-[#2C2C2E] border-b border-[#2C2C2E]">
                Common {formData.category} accounts:
              </div>
              {accountSuggestions[formData.category].map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, account: suggestion }));
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2C2C2E] focus:bg-[#2C2C2E] focus:outline-none text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </form>
    </div>
  );
};