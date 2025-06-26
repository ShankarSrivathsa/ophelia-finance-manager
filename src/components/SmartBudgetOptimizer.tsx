import React, { useState, useEffect } from 'react';
import { Target, Zap, TrendingUp, AlertCircle, CheckCircle, Loader2, Key, ExternalLink } from 'lucide-react';
import { aiService } from '../services/aiService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/accounting';

interface SmartBudgetOptimizerProps {
  currentMonth: string;
  onOptimizationComplete?: () => void;
}

interface BudgetOptimizationResponse {
  adjustments: Array<{
    category: string;
    currentAmount: number;
    suggestedAmount: number;
    reasoning: string;
    confidence: number;
  }>;
  totalSavings: number;
  impactAnalysis: string;
}

export const SmartBudgetOptimizer: React.FC<SmartBudgetOptimizerProps> = ({ 
  currentMonth, 
  onOptimizationComplete 
}) => {
  const [optimization, setOptimization] = useState<BudgetOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedAdjustments, setAppliedAdjustments] = useState<Set<string>>(new Set());

  const generateOptimization = async () => {
    if (!aiService.isConfigured()) {
      setError('AI service not configured. Please add an API key for Gemini, OpenAI, or Anthropic in your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch current budgets and spending data
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).toISOString().slice(0, 10);

      const [budgetsData, expensesData, incomeData, savingsGoalsData, profileData] = await Promise.all([
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      const budgets = budgetsData.data || [];
      const expenses = expensesData.data || [];
      const income = incomeData.data || [];
      const savingsGoals = savingsGoalsData.data || [];
      const profile = profileData.data;

      const monthlyIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
      const monthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Calculate spending by category
      const spendingByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      // Prepare financial data for AI
      const financialData = {
        monthlyIncome,
        monthlyExpenses,
        expenses: expenses.map(exp => ({
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          description: exp.description
        })),
        income: income.map(inc => ({
          amount: inc.amount,
          category: inc.category,
          date: inc.date,
          description: inc.description
        })),
        budgets: budgets.map(budget => ({
          category: budget.category,
          amount: budget.amount,
          spent: spendingByCategory[budget.category] || 0
        })),
        savingsGoals: savingsGoals.map(goal => ({
          name: goal.name,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          targetDate: goal.target_date
        })),
        userProfile: {
          persona: profile?.persona || 'general'
        }
      };

      const response = await aiService.optimizeBudget(financialData);
      setOptimization(response);
    } catch (err) {
      console.error('Error generating optimization:', err);
      setError('Failed to generate budget optimization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustment = async (adjustment: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the budget in the database
      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          category: adjustment.category,
          amount: adjustment.suggestedAmount,
          month: currentMonth
        });

      if (error) throw error;

      // Mark as applied
      setAppliedAdjustments(prev => new Set([...prev, adjustment.category]));
      onOptimizationComplete?.();
    } catch (err) {
      console.error('Error applying adjustment:', err);
      alert('Failed to apply budget adjustment. Please try again.');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50/55';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50/55';
    return 'text-red-600 bg-red-50/55';
  };

  const isConfigured = aiService.isConfigured();
  const providerName = aiService.getProviderName();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Smart Budget Optimizer</h2>
            {isConfigured && (
              <p className="text-sm text-gray-500">Powered by {providerName.charAt(0).toUpperCase() + providerName.slice(1)} AI</p>
            )}
          </div>
        </div>
        <button
          onClick={generateOptimization}
          disabled={loading || !isConfigured}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Optimize Budget
        </button>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="bg-yellow-50/55 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">AI Service Configuration Required</h3>
              <p className="text-yellow-700 mb-4">
                To use Smart Budget Optimization, you need to configure an AI API key. Add one of the following to your environment variables:
              </p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
                <li><code className="bg-yellow-100 px-2 py-1 rounded">VITE_GEMINI_API_KEY</code> - Google AI Studio (Recommended)</li>
                <li><code className="bg-yellow-100 px-2 py-1 rounded">VITE_OPENAI_API_KEY</code> - OpenAI GPT</li>
                <li><code className="bg-yellow-100 px-2 py-1 rounded">VITE_ANTHROPIC_API_KEY</code> - Anthropic Claude</li>
              </ul>
              <div className="flex gap-3">
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Gemini API Key (Free)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/55 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Optimization Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50/55 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Potential Monthly Savings</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(optimization.totalSavings)}</div>
              </div>
              <div className="bg-blue-50/55 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Adjustments Suggested</div>
                <div className="text-2xl font-bold text-blue-700">{optimization.adjustments.length}</div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-700">{optimization.impactAnalysis}</p>
            </div>
          </div>

          {/* Budget Adjustments */}
          {optimization.adjustments && optimization.adjustments.length > 0 && (
            <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI-Recommended Budget Adjustments</h3>
              <div className="space-y-4">
                {optimization.adjustments.map((adjustment, index) => {
                  const isApplied = appliedAdjustments.has(adjustment.category);
                  const difference = adjustment.suggestedAmount - adjustment.currentAmount;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/55">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-800">{adjustment.category}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600">
                              Current: {formatCurrency(adjustment.currentAmount)}
                            </span>
                            <span className="text-sm text-gray-600">→</span>
                            <span className="text-sm font-medium text-blue-600">
                              Suggested: {formatCurrency(adjustment.suggestedAmount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(adjustment.confidence)}`}>
                            {Math.round(adjustment.confidence * 100)}% confidence
                          </span>
                          {isApplied ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <button
                              onClick={() => applyAdjustment(adjustment)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className={`text-sm font-medium ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {difference > 0 ? '+' : ''}{formatCurrency(difference)} 
                          {difference > 0 ? ' increase' : ' decrease'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{adjustment.reasoning}</p>
                      
                      {isApplied && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Applied to your budget
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Getting Started Message */}
      {!optimization && !loading && isConfigured && (
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
          <Zap className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered Budget Optimization</h3>
          <p className="text-gray-600 mb-4">
            Get smart recommendations to optimize your budget based on your spending patterns and financial goals.
          </p>
          <p className="text-sm text-gray-500">
            Click "Optimize Budget" to analyze your current budget and get personalized suggestions.
          </p>
        </div>
      )}
    </div>
  );
};