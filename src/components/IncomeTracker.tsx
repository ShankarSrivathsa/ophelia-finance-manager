import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Calendar, Tag, FileText, Repeat } from 'lucide-react';
import { Income } from '../types/finance';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/accounting';

interface IncomeTrackerProps {
  onIncomeAdded: () => void;
}

const INCOME_CATEGORIES = [
  'Salary',
  'Allowance',
  'Freelance',
  'Business Revenue',
  'Pension',
  'Investment Returns',
  'Part-time Job',
  'Financial Aid',
  'Rental Income',
  'Other'
];

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({ onIncomeAdded }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Salary',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentIncome, setRecentIncome] = useState<Income[]>([]);

  useEffect(() => {
    loadRecentIncome();
  }, []);

  const loadRecentIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentIncome(data || []);
    } catch (error) {
      console.error('Error loading recent income:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('income')
        .insert({
          user_id: user.id,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          notes: formData.notes || null,
          is_recurring: formData.is_recurring
        });

      if (error) throw error;

      // Reset form
      setFormData({
        amount: '',
        category: 'Salary',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        is_recurring: false
      });

      loadRecentIncome();
      onIncomeAdded();
    } catch (error) {
      console.error('Error adding income:', error);
      alert('Failed to add income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Income Form */}
      <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Add Income</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/55"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/55"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/55"
            >
              {INCOME_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Source of income"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/55"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/55"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700 flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              This is recurring income
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Income
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Income */}
      {recentIncome.length > 0 && (
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Income</h3>
          <div className="space-y-3">
            {recentIncome.map((income) => (
              <div key={income.id} className="flex items-center justify-between p-3 bg-gray-50/55 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{income.description}</div>
                  <div className="text-sm text-gray-500">
                    {income.category} • {formatDate(income.date)}
                    {income.is_recurring && <span className="ml-2 text-green-600">🔄</span>}
                  </div>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  +{formatCurrency(income.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};