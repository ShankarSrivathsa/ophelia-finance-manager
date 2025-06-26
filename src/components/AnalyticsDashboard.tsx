import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Calendar } from 'lucide-react';
import { Expense, Budget, SpendingInsight, Income } from '../types/finance';
import { supabase } from '../lib/supabase';
import { getLastDayOfMonth, formatCurrency } from '../utils/accounting';

interface AnalyticsDashboardProps {
  currentMonth: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentMonth }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [currentMonth]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadIncome(),
        loadBudgets(),
        loadMonthlyTrends(),
        generateInsights()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${currentMonth}-01`;
      const endDate = getLastDayOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${currentMonth}-01`;
      const endDate = getLastDayOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncome(data || []);
    } catch (error) {
      console.error('Error loading income:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth);

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadMonthlyTrends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 6 months of data
      const months = [];
      const currentDate = new Date(currentMonth + '-01');
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        months.push(monthStr);
      }

      const trendsData = await Promise.all(
        months.map(async (month) => {
          const startDate = `${month}-01`;
          const endDate = getLastDayOfMonth(month);

          const [expenseData, incomeData] = await Promise.all([
            supabase
              .from('expenses')
              .select('amount')
              .eq('user_id', user.id)
              .gte('date', startDate)
              .lte('date', endDate),
            supabase
              .from('income')
              .select('amount')
              .eq('user_id', user.id)
              .gte('date', startDate)
              .lte('date', endDate)
          ]);

          if (expenseData.error) throw expenseData.error;
          if (incomeData.error) throw incomeData.error;

          const totalExpenses = expenseData.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
          const totalIncome = incomeData.data?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
          
          return {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            expenses: totalExpenses,
            income: totalIncome,
            netIncome: totalIncome - totalExpenses
          };
        })
      );

      setMonthlyTrends(trendsData);
    } catch (error) {
      console.error('Error loading monthly trends:', error);
    }
  };

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insights: SpendingInsight[] = [];

      // Get current month data
      const currentStartDate = `${currentMonth}-01`;
      const currentEndDate = getLastDayOfMonth(currentMonth);

      const [currentExpenses, currentIncome] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', currentStartDate)
          .lte('date', currentEndDate),
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', currentStartDate)
          .lte('date', currentEndDate)
      ]);

      // Get previous month data
      const prevDate = new Date(currentMonth + '-01');
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.toISOString().slice(0, 7);
      const prevStartDate = `${prevMonth}-01`;
      const prevEndDate = getLastDayOfMonth(prevMonth);

      const [prevExpenses, prevIncome] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', prevStartDate)
          .lte('date', prevEndDate),
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', prevStartDate)
          .lte('date', prevEndDate)
      ]);

      if (currentExpenses.data && prevExpenses.data) {
        // Calculate category changes
        const currentByCategory = currentExpenses.data.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);

        const prevByCategory = prevExpenses.data.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);

        Object.keys(currentByCategory).forEach(category => {
          const current = currentByCategory[category];
          const previous = prevByCategory[category] || 0;
          
          if (previous > 0) {
            const change = ((current - previous) / previous) * 100;
            
            if (Math.abs(change) > 20) {
              insights.push({
                type: change > 0 ? 'increase' : 'decrease',
                message: `Your ${category} expenses ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% this month`,
                category,
                percentage: Math.abs(change)
              });
            }
          }
        });
      }

      // Income vs Expenses insights
      if (currentIncome.data && currentExpenses.data) {
        const totalIncome = currentIncome.data.reduce((sum, inc) => sum + inc.amount, 0);
        const totalExpenses = currentExpenses.data.reduce((sum, exp) => sum + exp.amount, 0);
        
        if (totalIncome > 0) {
          const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
          
          if (savingsRate > 20) {
            insights.push({
              type: 'achievement',
              message: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income this month`,
              percentage: savingsRate
            });
          } else if (savingsRate < 0) {
            insights.push({
              type: 'warning',
              message: `You're spending ${Math.abs(savingsRate).toFixed(1)}% more than your income this month`,
              percentage: Math.abs(savingsRate)
            });
          }
        }
      }

      // Check budget breaches
      budgets.forEach(budget => {
        const categoryExpenses = expenses.filter(exp => exp.category === budget.category);
        const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const percentage = (spent / budget.amount) * 100;

        if (percentage > 100) {
          insights.push({
            type: 'warning',
            message: `You've exceeded your ${budget.category} budget by ${(percentage - 100).toFixed(1)}%`,
            category: budget.category,
            percentage: percentage - 100
          });
        } else if (percentage < 50) {
          insights.push({
            type: 'achievement',
            message: `Great job! You're only using ${percentage.toFixed(1)}% of your ${budget.category} budget`,
            category: budget.category,
            percentage
          });
        }
      });

      setInsights(insights.slice(0, 5)); // Limit to 5 insights
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

  // Category breakdown for pie chart
  const categoryData = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData)
    .map(([category, amount]) => ({ name: category, value: amount }))
    .sort((a, b) => b.value - a.value);

  // Top 3 spending categories
  const topCategories = pieData.slice(0, 3);

  // Budget vs actual for bar chart
  const budgetComparisonData = budgets.map(budget => {
    const spent = expenses
      .filter(exp => exp.category === budget.category)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      category: budget.category,
      budgeted: budget.amount,
      spent
    };
  });

  if (loading) {
    return (
      <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <BarChart className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Analytics & Reports</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            {netIncome >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-600">Net Income</h3>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Budget</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        {budgetComparisonData.length > 0 && (
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                <Bar dataKey="spent" fill="#EF4444" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Breakdown */}
        {pieData.length > 0 && (
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Financial Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="netIncome" stroke="#3B82F6" strokeWidth={2} name="Net Income" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Categories & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Spending Categories</h3>
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50/55 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">{formatCurrency(category.value)}</div>
                    <div className="text-sm text-gray-500">
                      {totalExpenses > 0 ? `${((category.value / totalExpenses) * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
          )}
        </div>

        {/* Smart Insights */}
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Smart Insights</h3>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'increase' ? 'bg-red-50/55 border-red-400' :
                  insight.type === 'decrease' ? 'bg-green-50/55 border-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-50/55 border-yellow-400' :
                  'bg-blue-50/55 border-blue-400'
                }`}>
                  <div className="flex items-start gap-2">
                    {insight.type === 'increase' && <TrendingUp className="w-4 h-4 text-red-600 mt-0.5" />}
                    {insight.type === 'decrease' && <TrendingDown className="w-4 h-4 text-green-600 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                    {insight.type === 'achievement' && <Target className="w-4 h-4 text-blue-600 mt-0.5" />}
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No insights available yet. Add more data to see smart insights!</p>
          )}
        </div>
      </div>
    </div>
  );
};