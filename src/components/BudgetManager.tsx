import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit3, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Budget, BudgetAnalysis } from '../types/finance';
import { supabase } from '../lib/supabase';
import { getLastDayOfMonth, formatCurrency } from '../utils/accounting';

interface BudgetManagerProps {
  currentMonth: string;
  onBudgetUpdated: () => void;
}

const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Other'
];

export const BudgetManager: React.FC<BudgetManagerProps> = ({ currentMonth, onBudgetUpdated }) => {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBudgets();
    loadBudgetAnalysis();
  }, [currentMonth]);

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .order('category');

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadBudgetAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get budgets for current month
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth);

      if (budgetError) throw budgetError;

      // Get expenses for current month
      const startDate = `${currentMonth}-01`;
      const endDate = getLastDayOfMonth(currentMonth);
      
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (expenseError) throw expenseError;

      // Calculate analysis
      const analysis: BudgetAnalysis[] = (budgetData || []).map(budget => {
        const categoryExpenses = expenseData?.filter(exp => exp.category === budget.category) || [];
        const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        let status: 'under' | 'over' | 'on-track' = 'under';
        if (percentage > 100) status = 'over';
        else if (percentage >= 80) status = 'on-track';

        return {
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining,
          percentage,
          status
        };
      });

      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Error loading budget analysis:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from('budgets')
          .update({
            amount: parseFloat(formData.amount)
          })
          .eq('id', editingBudget.id);

        if (error) throw error;
      } else {
        // Create new budget
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category: formData.category,
            amount: parseFloat(formData.amount),
            month: currentMonth
          });

        if (error) throw error;
      }

      // Reset form
      setFormData({ category: 'Food & Dining', amount: '' });
      setShowAddForm(false);
      setEditingBudget(null);
      loadBudgets();
      loadBudgetAnalysis();
      onBudgetUpdated();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm(t('common.confirm'))) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      loadBudgets();
      loadBudgetAnalysis();
      onBudgetUpdated();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'text-green-400 bg-green-900/50 border-green-700';
      case 'on-track': return 'text-yellow-400 bg-yellow-900/50 border-yellow-700';
      case 'over': return 'text-red-400 bg-red-900/50 border-red-700';
      default: return 'text-gray-300 bg-[#2C2C2E] border-[#2C2C2E]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under': return <CheckCircle className="w-4 h-4" />;
      case 'on-track': return <AlertTriangle className="w-4 h-4" />;
      case 'over': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'under': return t('budgets.underBudget');
      case 'on-track': return t('budgets.onTrack');
      case 'over': return t('budgets.overBudget');
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-white">{t('budgets.title')}</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('budgets.addBudget')}
        </button>
      </div>

      {/* Budget Analysis */}
      {budgetAnalysis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetAnalysis.map((analysis) => (
            <div key={analysis.category} className="bg-[#1F1F1F] backdrop-blur-sm rounded-lg shadow-md p-4 border border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">{analysis.category}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(analysis.status)}`}>
                  {getStatusIcon(analysis.status)}
                  {getStatusText(analysis.status)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t('budgets.budgeted')}:</span>
                  <span className="font-medium text-white">{formatCurrency(analysis.budgeted)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t('budgets.spent')}:</span>
                  <span className="font-medium text-white">{formatCurrency(analysis.spent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t('budgets.remaining')}:</span>
                  <span className={`font-medium ${analysis.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(analysis.remaining)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-[#2C2C2E] rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      analysis.percentage > 100 ? 'bg-red-500' :
                      analysis.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(analysis.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {analysis.percentage.toFixed(1)}% of budget used
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget List */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <h3 className="text-lg font-semibold text-white mb-4">{t('budgets.monthlyBudgets')}</h3>
        
        {budgets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t('budgets.noBudgets')}</p>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-[#2C2C2E] rounded-lg">
                <div>
                  <div className="font-medium text-white">{budget.category}</div>
                  <div className="text-sm text-gray-400">Monthly budget</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(budget.amount)}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setFormData({ category: budget.category, amount: budget.amount.toString() });
                        setShowAddForm(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-md border border-[#2C2C2E]">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingBudget ? t('common.edit') + ' ' + t('budgets.title') : t('budgets.addBudget')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={!!editingBudget}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent disabled:bg-[#2C2C2E] bg-[#1F1F1F] text-white"
                >
                  {BUDGET_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={t('expenses.placeholder.amount')}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBudget(null);
                    setFormData({ category: 'Food & Dining', amount: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-[#2C2C2E] text-gray-300 rounded-lg hover:bg-[#2C2C2E] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t('common.loading') : editingBudget ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};