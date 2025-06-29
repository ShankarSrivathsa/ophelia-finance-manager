import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Loader2, Key, ExternalLink } from 'lucide-react';
import { aiService } from '../services/aiService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/accounting';

interface AIFinancialAdvisorProps {
  onAdviceGenerated?: () => void;
}

interface FinancialAdviceResponse {
  advice: string;
  recommendations: Array<{
    category: string;
    action: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  insights: Array<{
    type: 'warning' | 'opportunity' | 'achievement';
    message: string;
    data?: any;
  }>;
}

export const AIFinancialAdvisor: React.FC<AIFinancialAdvisorProps> = ({ onAdviceGenerated }) => {
  const [advice, setAdvice] = useState<FinancialAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<'general_advice' | 'budget_optimization' | 'savings_strategy' | 'expense_analysis'>('general_advice');

  const generateAdvice = async () => {
    if (!aiService.isConfigured()) {
      setError('AI service not configured. Please add an API key for Gemini, OpenAI, or Anthropic in your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch user's financial data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

      const [expensesData, incomeData, budgetsData, savingsData, profileData] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth),
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

      const expenses = expensesData.data || [];
      const income = incomeData.data || [];
      const budgets = budgetsData.data || [];
      const savingsGoals = savingsData.data || [];
      const profile = profileData.data;

      const monthlyIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
      const monthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Prepare data for AI service
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

      const response = await aiService.getFinancialAdvice(financialData, requestType);
      setAdvice(response);
      onAdviceGenerated?.();
    } catch (err) {
      console.error('Error generating advice:', err);
      setError('Failed to generate financial advice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'achievement': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <Lightbulb className="w-4 h-4 text-purple-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-700 bg-red-900/50';
      case 'medium': return 'border-yellow-700 bg-yellow-900/50';
      case 'low': return 'border-green-700 bg-green-900/50';
      default: return 'border-gray-700 bg-gray-900/50';
    }
  };

  const isConfigured = aiService.isConfigured();
  const providerName = aiService.getProviderName();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Financial Advisor</h2>
            {isConfigured && (
              <p className="text-sm text-gray-400">Powered by {providerName.charAt(0).toUpperCase() + providerName.slice(1)} AI</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as any)}
            className="px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
            disabled={!isConfigured}
          >
            <option value="general_advice">General Advice</option>
            <option value="budget_optimization">Budget Optimization</option>
            <option value="savings_strategy">Savings Strategy</option>
            <option value="expense_analysis">Expense Analysis</option>
          </select>
          <button
            onClick={generateAdvice}
            disabled={loading || !isConfigured}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            Get AI Advice
          </button>
        </div>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="bg-yellow-900/50 border border-yellow-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Service Configuration Required</h3>
              <p className="text-gray-300 mb-4">
                To use the AI Financial Advisor, you need to configure an AI API key. Add one of the following to your environment variables:
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
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-300 hover:text-white font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get OpenAI API Key
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

      {/* AI Advice Display */}
      {advice && (
        <div className="space-y-6">
          {/* Main Advice */}
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-white" />
              <h3 className="text-lg font-semibold text-white">AI Financial Advice</h3>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-300 leading-relaxed">{advice.advice}</p>
            </div>
          </div>

          {/* Recommendations */}
          {advice.recommendations && advice.recommendations.length > 0 && (
            <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
              <h3 className="text-lg font-semibold text-white mb-4">Personalized Recommendations</h3>
              <div className="space-y-3">
                {advice.recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{rec.category}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                        rec.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2 font-medium">{rec.action}</p>
                    <p className="text-sm text-gray-400">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {advice.insights && advice.insights.length > 0 && (
            <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
              <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
              <div className="space-y-3">
                {advice.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#2C2C2E] rounded-lg">
                    {getInsightIcon(insight.type)}
                    <div>
                      <p className="text-gray-300">{insight.message}</p>
                      {insight.data && (
                        <div className="mt-2 text-sm text-gray-400">
                          <pre className="bg-[#1F1F1F] p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(insight.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Getting Started Message */}
      {!advice && !loading && isConfigured && (
        <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-[#2C2C2E]">
          <Brain className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Financial Guidance</h3>
          <p className="text-gray-300 mb-4">
            Get personalized financial advice based on your spending patterns, income, and goals.
          </p>
          <p className="text-sm text-gray-400">
            Select an advice type and click "Get AI Advice" to start.
          </p>
        </div>
      )}
    </div>
  );
};