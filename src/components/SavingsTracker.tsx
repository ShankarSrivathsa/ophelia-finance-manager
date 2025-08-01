import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, Target, TrendingUp, Calendar, DollarSign, Edit3, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SavingsGoal, SavingsTransaction, SavingsAnalysis } from '../types/finance';
import { supabase } from '../lib/supabase';
import { formatCurrency, getLastDayOfMonth } from '../utils/accounting';

interface SavingsTrackerProps {
  onSavingsUpdated: () => void;
}

const SAVINGS_CATEGORIES = [
  'Emergency Fund',
  'Vacation',
  'Car Purchase',
  'Home Down Payment',
  'Education',
  'Retirement',
  'Wedding',
  'Electronics',
  'Investment',
  'Other'
];

export const SavingsTracker: React.FC<SavingsTrackerProps> = ({ onSavingsUpdated }) => {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [analysis, setAnalysis] = useState<SavingsAnalysis | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    category: 'Emergency Fund',
    description: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    goal_id: '',
    amount: '',
    type: 'deposit' as 'deposit' | 'withdrawal',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadSavingsData();
  }, []);

  const loadSavingsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGoals(),
        loadTransactions(),
        generateAnalysis()
      ]);
    } catch (error) {
      console.error('Error loading savings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const generateAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const startDate = `${currentMonth}-01`;
      const endDate = getLastDayOfMonth(currentMonth);

      const [savingsData, incomeData, expenseData, goalsData] = await Promise.all([
        supabase
          .from('savings_transactions')
          .select('amount, type, date')
          .eq('user_id', user.id),
        supabase
          .from('income')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('expenses')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
      ]);

      if (savingsData.error) throw savingsData.error;
      if (incomeData.error) throw incomeData.error;
      if (expenseData.error) throw expenseData.error;
      if (goalsData.error) throw goalsData.error;

      // Calculate total saved
      const totalSaved = savingsData.data?.reduce((sum, transaction) => {
        return sum + (transaction.type === 'deposit' ? transaction.amount : -transaction.amount);
      }, 0) || 0;

      // Calculate monthly average (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentSavings = savingsData.data?.filter(t => 
        new Date(t.date) >= sixMonthsAgo
      ) || [];
      const monthlyAverage = recentSavings.length > 0 ? 
        recentSavings.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0) / 6 : 0;

      // Calculate savings rate
      const totalIncome = incomeData.data?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
      const totalExpenses = expenseData.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const monthlySavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;

      // Calculate goal progress
      const goalProgress = goalsData.data?.map(goal => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        const remaining = goal.target_amount - goal.current_amount;
        const targetDate = new Date(goal.target_date);
        const today = new Date();
        const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate if on track (simple linear projection)
        const monthsLeft = daysLeft / 30;
        const requiredMonthlySavings = monthsLeft > 0 ? remaining / monthsLeft : 0;
        const onTrack = monthlyAverage >= requiredMonthlySavings || progress >= 100;

        return {
          goalId: goal.id,
          goalName: goal.name,
          progress,
          remaining,
          daysLeft,
          onTrack
        };
      }) || [];

      // Generate monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        const monthStart = `${monthStr}-01`;
        const monthEnd = getLastDayOfMonth(monthStr);

        const [monthIncome, monthExpenses, monthSavings] = await Promise.all([
          supabase
            .from('income')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', monthStart)
            .lte('date', monthEnd),
          supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', monthStart)
            .lte('date', monthEnd),
          supabase
            .from('savings_transactions')
            .select('amount, type')
            .eq('user_id', user.id)
            .gte('date', monthStart)
            .lte('date', monthEnd)
        ]);

        const income = monthIncome.data?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
        const expenses = monthExpenses.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
        const saved = monthSavings.data?.reduce((sum, sav) => 
          sum + (sav.type === 'deposit' ? sav.amount : -sav.amount), 0) || 0;
        const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          saved,
          income,
          expenses,
          savingsRate: rate
        });
      }

      setAnalysis({
        totalSaved,
        monthlyAverage,
        savingsRate,
        goalProgress,
        monthlyTrend
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target_amount || !goalForm.target_date) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingGoal) {
        const { error } = await supabase
          .from('savings_goals')
          .update({
            name: goalForm.name,
            target_amount: parseFloat(goalForm.target_amount),
            target_date: goalForm.target_date,
            category: goalForm.category,
            description: goalForm.description || null
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert({
            user_id: user.id,
            name: goalForm.name,
            target_amount: parseFloat(goalForm.target_amount),
            current_amount: 0,
            target_date: goalForm.target_date,
            category: goalForm.category,
            description: goalForm.description || null,
            is_active: true
          });

        if (error) throw error;
      }

      setGoalForm({
        name: '',
        target_amount: '',
        target_date: '',
        category: 'Emergency Fund',
        description: ''
      });
      setShowAddGoal(false);
      setEditingGoal(null);
      loadSavingsData();
      onSavingsUpdated();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.goal_id || !transactionForm.amount || !transactionForm.description) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const amount = parseFloat(transactionForm.amount);
      const goal = goals.find(g => g.id === transactionForm.goal_id);
      if (!goal) throw new Error('Goal not found');

      // Add transaction
      const { error: transactionError } = await supabase
        .from('savings_transactions')
        .insert({
          user_id: user.id,
          goal_id: transactionForm.goal_id,
          amount,
          type: transactionForm.type,
          description: transactionForm.description,
          date: transactionForm.date
        });

      if (transactionError) throw transactionError;

      // Update goal current amount
      const newAmount = transactionForm.type === 'deposit' 
        ? goal.current_amount + amount 
        : goal.current_amount - amount;

      const { error: goalError } = await supabase
        .from('savings_goals')
        .update({ current_amount: Math.max(0, newAmount) })
        .eq('id', transactionForm.goal_id);

      if (goalError) throw goalError;

      setTransactionForm({
        goal_id: '',
        amount: '',
        type: 'deposit',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
      loadSavingsData();
      onSavingsUpdated();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(t('common.confirm'))) return;

    try {
      // Delete transactions first
      await supabase
        .from('savings_transactions')
        .delete()
        .eq('goal_id', goalId);

      // Delete goal
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      loadSavingsData();
      onSavingsUpdated();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'text-red-400';
    if (daysLeft < 30) return 'text-orange-400';
    if (daysLeft < 90) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2C2C2E] border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-white">{t('savings.title')}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddGoal(true)}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            {t('savings.addGoal')}
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('savings.addTransaction')}
          </button>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-sm font-medium text-gray-300">{t('savings.totalSaved')}</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analysis.totalSaved)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-300">{t('savings.monthlyAverage')}</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analysis.monthlyAverage)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-300">{t('savings.savingsRate')}</h3>
                <p className="text-2xl font-bold text-white">{analysis.savingsRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goals */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <h3 className="text-lg font-semibold text-white mb-4">{t('savings.savingsGoals')}</h3>
        
        {goals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t('savings.noGoals')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const remaining = goal.target_amount - goal.current_amount;
              const targetDate = new Date(goal.target_date);
              const today = new Date();
              const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={goal.id} className="border border-[#2C2C2E] rounded-lg p-4 bg-[#2C2C2E]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{goal.name}</h4>
                      <p className="text-sm text-gray-400">{goal.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setGoalForm({
                            name: goal.name,
                            target_amount: goal.target_amount.toString(),
                            target_date: goal.target_date,
                            category: goal.category,
                            description: goal.description || ''
                          });
                          setShowAddGoal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{t('savings.progress')}</span>
                      <span className="font-medium text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{formatCurrency(goal.current_amount)} saved</span>
                      <span>{formatCurrency(goal.target_amount)} goal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{t('savings.remaining')}: {formatCurrency(remaining)}</span>
                      <span className={getDaysLeftColor(daysLeft)}>
                        {daysLeft > 0 ? `${daysLeft} ${t('savings.daysLeft')}` : `${Math.abs(daysLeft)} ${t('savings.daysOverdue')}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
          <h3 className="text-lg font-semibold text-white mb-4">{t('savings.recentTransactions')}</h3>
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const goal = goals.find(g => g.id === transaction.goal_id);
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-[#2C2C2E] rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'deposit' ? (
                      <ArrowUpCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-white">{transaction.description}</div>
                      <div className="text-sm text-gray-400">
                        {goal?.name} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-md border border-[#2C2C2E]">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingGoal ? t('common.edit') + ' ' + t('savings.goalName') : t('savings.addGoal')}
            </h3>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('savings.goalName')}</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund"
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('savings.targetAmount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, target_amount: e.target.value }))}
                  placeholder={t('expenses.placeholder.amount')}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('savings.targetDate')}</label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, target_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.category')}</label>
                <select
                  value={goalForm.category}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                >
                  {SAVINGS_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.description')} ({t('expenses.notes')})</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Why are you saving for this?"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGoal(false);
                    setEditingGoal(null);
                    setGoalForm({
                      name: '',
                      target_amount: '',
                      target_date: '',
                      category: 'Emergency Fund',
                      description: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-[#2C2C2E] text-gray-300 rounded-lg hover:bg-[#2C2C2E] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {editingGoal ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-md border border-[#2C2C2E]">
            <h3 className="text-lg font-semibold text-white mb-4">{t('savings.addTransaction')}</h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('savings.savingsGoals')}</label>
                <select
                  value={transactionForm.goal_id}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, goal_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                >
                  <option value="">Select a goal</option>
                  {goals.filter(g => g.is_active).map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as 'deposit' | 'withdrawal' }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                >
                  <option value="deposit">Deposit (Add Money)</option>
                  <option value="withdrawal">Withdrawal (Take Money)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={t('expenses.placeholder.amount')}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.date')}</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('expenses.description')}</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Monthly savings deposit"
                  className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTransaction(false);
                    setTransactionForm({
                      goal_id: '',
                      amount: '',
                      type: 'deposit',
                      description: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-[#2C2C2E] text-gray-300 rounded-lg hover:bg-[#2C2C2E] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};