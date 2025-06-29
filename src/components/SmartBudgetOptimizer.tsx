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
        budgets: budgets.map(budget => {
          const spent = expenses
            .filter(exp => exp.category === budget.category)
            .reduce((sum, exp) => sum + exp.amount, 0);
          return {
            category: budget.category,
            amount: budget.amount,
            spent
          };
        }),
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
    if (confidence >= 0.8) return 'text-green-400 bg-green-900/50 border-green-700';
    if (confidence >= 0.6) return 'text-yellow-400 bg-yellow-900/50 border-yellow-700';
    return 'text-red-400 bg-red-900/50 border-red-700';
  };

  const isConfigured = aiService.isConfigured();
  const providerName = aiService.getProviderName();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Smart Budget Optimizer</h2>
            {isConfigured && (
              <p className="text-sm text-gray-400">Powered by {providerName.charAt(0).toUpperCase() + providerName.slice(1)} AI</p>
            )}
          </div>
        </div>
        <button
          onClick={generateOptimization}
          disabled={loading || !isConfigured}
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
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
        <div className="bg-yellow-900/50 border border-yellow-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Service Configuration Required</h3>
              <p className="text-gray-300 mb-4">
                To use Smart Budget Optimization, you need to configure an AI API key. Add one of the following to your environment variables:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                <li><code className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">VITE_GEMINI_API_KEY</code> - Google AI Studio (Recommended)</li>
                <li><code className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">VITE_OPENAI_API_KEY</code> - OpenAI GPT</li>
                <li><code className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">VITE_ANTHROPIC_API_KEY</code> - Anthropic Claude</li>
              </ul>
              <div className="flex gap-3">
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-300 hover:text-white font-medium"
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
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Optimization Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-900/50 p-4 rounded-lg border border-green-700">
                <div className="text-sm text-green-400 font-medium">Potential Monthly Savings</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(optimization.totalSavings)}</div>
              </div>
              <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-700">
                <div className="text-sm text-blue-400 font-medium">Adjustments Suggested</div>
                <div className="text-2xl font-bold text-white">{optimization.adjustments.length}</div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-white">{optimization.impactAnalysis}</p>
            </div>
          </div>

          {/* Budget Adjustments */}
          {optimization.adjustments && optimization.adjustments.length > 0 && (
            <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
              <h3 className="text-lg font-semibold text-white mb-4">AI-Recommended Budget Adjustments</h3>
              <div className="space-y-4">
                {optimization.adjustments.map((adjustment, index) => {
                  const isApplied = appliedAdjustments.has(adjustment.category);
                  const difference = adjustment.suggestedAmount - adjustment.currentAmount;
                  
                  return (
                    <div key={index} className="border border-[#2C2C2E] rounded-lg p-4 bg-[#2C2C2E]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white">{adjustment.category}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-300">
                              Current: {formatCurrency(adjustment.currentAmount)}
                            </span>
                            <span className="text-sm text-gray-300">→</span>
                            <span className="text-sm font-medium text-blue-400">
                              Suggested: {formatCurrency(adjustment.suggestedAmount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(adjustment.confidence)}`}>
                            {Math.round(adjustment.confidence * 100)}% confidence
                          </span>
                          {isApplied ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <button
                              onClick={() => applyAdjustment(adjustment)}
                              className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className={`text-sm font-medium ${difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {difference > 0 ? '+' : ''}{formatCurrency(difference)} 
                          {difference > 0 ? ' increase' : ' decrease'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300">{adjustment.reasoning}</p>
                      
                      {isApplied && (
                        <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
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
        <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-[#2C2C2E]">
          <Zap className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Budget Optimization</h3>
          <p className="text-white mb-4">
            Get smart recommendations to optimize your budget based on your spending patterns and financial goals.
          </p>
          <p className="text-sm text-gray-300">
            Click "Optimize Budget" to analyze your current budget and get personalized suggestions.
          </p>
        </div>
      )}
    </div>
  );
};