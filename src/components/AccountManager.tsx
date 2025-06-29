import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { CustomAccount } from '../types/finance';
import { supabase } from '../lib/supabase';

interface AccountManagerProps {
  onAccountsUpdated: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ onAccountsUpdated }) => {
  const [accounts, setAccounts] = useState<CustomAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'asset' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('custom_accounts')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          category: formData.category
        });

      if (error) throw error;

      setFormData({ name: '', category: 'asset' });
      setShowAddForm(false);
      loadAccounts();
      onAccountsUpdated();
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('custom_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      loadAccounts();
      onAccountsUpdated();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-white">Account Manager</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Accounts List */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Accounts</h3>
        
        {accounts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No custom accounts yet. Add your first account to get started!</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-[#2C2C2E] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-white">{account.name}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(account.category)}`}>
                    {account.category.charAt(0).toUpperCase() + account.category.slice(1)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-md border border-[#2C2C2E]">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Account</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Personal Savings, Business Checking"
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', category: 'asset' });
                  }}
                  className="flex-1 px-4 py-2 border border-[#2C2C2E] text-gray-300 rounded-lg hover:bg-[#2C2C2E] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};