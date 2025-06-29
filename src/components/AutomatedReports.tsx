import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, Loader2, TrendingUp, TrendingDown, Key, ExternalLink } from 'lucide-react';
import { aiService } from '../services/aiService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/accounting';

interface AutomatedReportsProps {
  currentMonth: string;
}

interface ReportResponse {
  reportTitle: string;
  summary: string;
  sections: Array<{
    title: string;
    content: string;
    data?: any;
  }>;
  keyMetrics: Array<{
    name: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    significance: string;
  }>;
  recommendations: string[];
}

export const AutomatedReports: React.FC<AutomatedReportsProps> = ({ currentMonth }) => {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'monthly_summary' | 'spending_analysis' | 'savings_progress' | 'financial_health'>('monthly_summary');
  const [dateRange, setDateRange] = useState({
    startDate: `${currentMonth}-01`,
    endDate: new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).toISOString().slice(0, 10)
  });

  useEffect(() => {
    setDateRange({
      startDate: `${currentMonth}-01`,
      endDate: new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).toISOString().slice(0, 10)
    });
  }, [currentMonth]);

  const generateReport = async () => {
    if (!aiService.isConfigured()) {
      setError('AI service not configured. Please add an API key for Gemini, OpenAI, or Anthropic in your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch financial data for the specified date range
      const [expensesData, incomeData, budgetsData, savingsData, profileData] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
          .order('date', { ascending: false }),
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id),
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

      const response = await aiService.generateReport(financialData, reportType, dateRange);
      setReport(response);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const reportContent = `
# ${report.reportTitle}

## Executive Summary
${report.summary}

${report.sections.map(section => `
## ${section.title}
${section.content}
`).join('\n')}

## Key Performance Metrics
${report.keyMetrics.map(metric => `- **${metric.name}**: ${metric.value} (${metric.trend}) - ${metric.significance}`).join('\n')}

## AI Recommendations
${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---
*Generated by AI Financial Advisor on ${new Date().toLocaleDateString()}*
*Report Period: ${dateRange.startDate} to ${dateRange.endDate}*
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${reportType}-${dateRange.startDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly_summary': return 'Monthly Summary';
      case 'spending_analysis': return 'Spending Analysis';
      case 'savings_progress': return 'Savings Progress';
      case 'financial_health': return 'Financial Health';
      default: return type;
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
            <FileText className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI-Generated Reports</h2>
            {isConfigured && (
              <p className="text-sm text-gray-400">Powered by {providerName.charAt(0).toUpperCase() + providerName.slice(1)} AI</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={downloadReport}
              className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          <button
            onClick={generateReport}
            disabled={loading || !isConfigured}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Generate Report
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
                To generate AI-powered reports, you need to configure an AI API key. Add one of the following to your environment variables:
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

      {/* Report Configuration */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
        <h3 className="text-lg font-semibold text-white mb-4">Report Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
              disabled={!isConfigured}
            >
              <option value="monthly_summary">Monthly Summary</option>
              <option value="spending_analysis">Spending Analysis</option>
              <option value="savings_progress">Savings Progress</option>
              <option value="financial_health">Financial Health</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
              disabled={!isConfigured}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
              disabled={!isConfigured}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Generated Report */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{report.reportTitle}</h3>
              <span className="text-sm text-gray-400">
                {dateRange.startDate} to {dateRange.endDate}
              </span>
            </div>
            <p className="text-white leading-relaxed">{report.summary}</p>
          </div>

          {/* Key Metrics */}
          {report.keyMetrics && report.keyMetrics.length > 0 && (
            <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
              <h3 className="text-lg font-semibold text-white mb-4">Key Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.keyMetrics.map((metric, index) => (
                  <div key={index} className="bg-[#2C2C2E] p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-xl font-bold text-white">{metric.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{metric.significance}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Sections */}
          {report.sections && report.sections.length > 0 && (
            <div className="space-y-4">
              {report.sections.map((section, index) => (
                <div key={index} className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
                  <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-white leading-relaxed whitespace-pre-line">{section.content}</p>
                  </div>
                  {section.data && (
                    <div className="mt-4 bg-[#2C2C2E] p-4 rounded-lg">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(section.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#2C2C2E]">
              <h3 className="text-lg font-semibold text-white mb-4">AI-Powered Recommendations</h3>
              <div className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-900/50 rounded-lg border border-blue-700">
                    <div className="w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-white">{index + 1}</span>
                    </div>
                    <p className="text-white">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Getting Started Message */}
      {!report && !loading && isConfigured && (
        <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-[#2C2C2E]">
          <FileText className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI-Generated Financial Reports</h3>
          <p className="text-white mb-4">
            Generate comprehensive financial reports with AI-powered insights and recommendations.
          </p>
          <p className="text-sm text-gray-300">
            Configure your report settings and click "Generate Report" to get started.
          </p>
        </div>
      )}
    </div>
  );
};