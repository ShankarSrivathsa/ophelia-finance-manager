import { formatCurrency } from '../utils/accounting';
import { PersonaQuizSuggestions, PersonaSuggestion } from '../types/finance';
import { picahqService } from './picahqService';

interface FinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  expenses: Array<{
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
  income: Array<{
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
  budgets: Array<{
    category: string;
    amount: number;
    spent: number;
  }>;
  savingsGoals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
  }>;
  userProfile?: {
    persona: string;
  };
}

interface AIAdviceResponse {
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

class AIService {
  async getFinancialAdvice(financialData: FinancialData, requestType: string): Promise<AIAdviceResponse> {
    try {
      // Prepare the request for PicaHQ
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const request = {
        userId,
        userProfile: {
          persona: financialData.userProfile?.persona || 'general',
          monthlyIncome: financialData.monthlyIncome,
          monthlyExpenses: financialData.monthlyExpenses,
          savingsGoals: financialData.savingsGoals.map(goal => ({
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            targetDate: goal.targetDate
          })),
          recentTransactions: [
            ...financialData.expenses.map(exp => ({
              amount: exp.amount,
              category: exp.category,
              date: exp.date,
              type: 'expense' as const
            })),
            ...financialData.income.map(inc => ({
              amount: inc.amount,
              category: inc.category,
              date: inc.date,
              type: 'income' as const
            }))
          ]
        },
        requestType: requestType as any
      };

      // Call PicaHQ service
      const response = await picahqService.getFinancialAdvice(request);
      return response;
    } catch (error) {
      console.error('AI advice generation failed:', error);
      return this.getFallbackAdvice(financialData);
    }
  }

  async optimizeBudget(financialData: FinancialData): Promise<BudgetOptimizationResponse> {
    try {
      // Prepare the request for PicaHQ
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Calculate spending patterns
      const spendingPatterns = this.calculateSpendingPatterns(financialData);

      const request = {
        userId,
        currentBudgets: financialData.budgets.map(budget => ({
          category: budget.category,
          budgeted: budget.amount,
          spent: budget.spent,
          remaining: budget.amount - budget.spent
        })),
        spendingPatterns,
        financialGoals: financialData.savingsGoals.map(goal => ({
          name: goal.name,
          targetAmount: goal.targetAmount,
          timeframe: this.calculateTimeframe(goal.targetDate)
        }))
      };

      // Call PicaHQ service
      const response = await picahqService.getBudgetAdjustments(request);
      return response;
    } catch (error) {
      console.error('Budget optimization failed:', error);
      return this.getFallbackBudgetOptimization(financialData);
    }
  }

  async generateReport(financialData: FinancialData, reportType: string, dateRange: { startDate: string; endDate: string }): Promise<ReportResponse> {
    try {
      // Prepare the request for PicaHQ
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const request = {
        userId,
        reportType: reportType as any,
        dateRange,
        includeCharts: true,
        includeRecommendations: true
      };

      // Call PicaHQ service
      const response = await picahqService.generateAutomatedReport(request);
      return response;
    } catch (error) {
      console.error('Report generation failed:', error);
      return this.getFallbackReport(financialData, reportType);
    }
  }

  async getPersonaQuizSuggestions(persona: string, quizAnswers: string[]): Promise<PersonaQuizSuggestions> {
    try {
      // For persona suggestions, we'll use the local implementation
      // since this is a simpler task and doesn't require the full power of PicaHQ
      return this.getFallbackPersonaQuizSuggestions(persona);
    } catch (error) {
      console.error('Persona quiz suggestions generation failed:', error);
      return this.getFallbackPersonaQuizSuggestions(persona);
    }
  }

  private async getUserId(): Promise<string | null> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  private calculateSpendingPatterns(data: FinancialData): Array<{
    category: string;
    averageMonthly: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    data.expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    // Convert to array and calculate average
    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      averageMonthly: total,
      trend: 'stable' as const // We don't have historical data for trend analysis
    }));
  }

  private calculateTimeframe(targetDate: string): string {
    const target = new Date(targetDate);
    const now = new Date();
    const diffMonths = (target.getFullYear() - now.getFullYear()) * 12 + 
                       (target.getMonth() - now.getMonth());
    
    if (diffMonths <= 1) return 'short-term';
    if (diffMonths <= 12) return 'medium-term';
    return 'long-term';
  }

  private getFallbackAdvice(data: FinancialData): AIAdviceResponse {
    const netIncome = data.monthlyIncome - data.monthlyExpenses;
    const savingsRate = data.monthlyIncome > 0 ? ((netIncome / data.monthlyIncome) * 100) : 0;
    
    const recommendations = [];
    const insights = [];
    
    if (savingsRate < 10) {
      recommendations.push({
        category: 'Savings',
        action: 'Increase your savings rate to at least 10% of income',
        impact: 'Build financial security and emergency fund',
        priority: 'high' as const
      });
      insights.push({
        type: 'warning' as const,
        message: `Your current savings rate of ${savingsRate.toFixed(1)}% is below the recommended 10-20%`
      });
    }
    
    if (savingsRate > 30) {
      insights.push({
        type: 'achievement' as const,
        message: `Excellent! Your savings rate of ${savingsRate.toFixed(1)}% is well above average`
      });
    }
    
    // Check budget overruns
    data.budgets.forEach(budget => {
      const percentage = (budget.spent / budget.amount) * 100;
      if (percentage > 100) {
        recommendations.push({
          category: budget.category,
          action: `Reduce ${budget.category} spending by $${(budget.spent - budget.amount).toFixed(2)}`,
          impact: 'Get back on track with your budget',
          priority: 'high' as const
        });
      }
    });
    
    return {
      advice: `Based on your financial data, you have a ${savingsRate.toFixed(1)}% savings rate. ${savingsRate < 10 ? 'Focus on reducing expenses and increasing savings.' : savingsRate > 20 ? 'Great job maintaining a healthy savings rate!' : 'You\'re on the right track, consider optimizing your budget further.'}`,
      recommendations,
      insights
    };
  }

  private getFallbackBudgetOptimization(data: FinancialData): BudgetOptimizationResponse {
    const adjustments = data.budgets
      .filter(budget => (budget.spent / budget.amount) > 1.1) // Over budget by 10%
      .map(budget => ({
        category: budget.category,
        currentAmount: budget.amount,
        suggestedAmount: Math.ceil(budget.spent * 1.1),
        reasoning: 'Increase budget to accommodate actual spending patterns with 10% buffer',
        confidence: 0.7
      }));
    
    const totalSavings = adjustments.reduce((sum, adj) => sum + (adj.suggestedAmount - adj.currentAmount), 0);
    
    return {
      adjustments,
      totalSavings: Math.abs(totalSavings),
      impactAnalysis: adjustments.length > 0 
        ? 'Adjusting overrun categories will help you maintain realistic budgets and reduce financial stress.'
        : 'Your budget is well-balanced. Consider minor optimizations to increase savings.'
    };
  }

  private getFallbackReport(data: FinancialData, reportType: string): ReportResponse {
    const totalIncome = data.income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    return {
      reportTitle: `${reportType.replace('_', ' ').toUpperCase()} Financial Report`,
      summary: `This period you earned $${totalIncome.toFixed(2)} and spent $${totalExpenses.toFixed(2)}, resulting in a net ${netIncome >= 0 ? 'income' : 'loss'} of $${Math.abs(netIncome).toFixed(2)}.`,
      sections: [
        {
          title: 'Income Analysis',
          content: `Your total income for this period was $${totalIncome.toFixed(2)}. This represents your earning capacity during the analyzed timeframe.`
        },
        {
          title: 'Expense Analysis', 
          content: `Your total expenses were $${totalExpenses.toFixed(2)}. Review your spending categories to identify optimization opportunities.`
        }
      ],
      keyMetrics: [
        {
          name: 'Net Income',
          value: `$${netIncome.toFixed(2)}`,
          trend: netIncome >= 0 ? 'up' : 'down',
          significance: netIncome >= 0 ? 'Positive cash flow' : 'Spending exceeds income'
        },
        {
          name: 'Savings Rate',
          value: `${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%`,
          trend: 'stable',
          significance: 'Percentage of income saved'
        }
      ],
      recommendations: [
        netIncome < 0 ? 'Focus on reducing expenses to achieve positive cash flow' : 'Consider investing surplus income for long-term growth',
        'Review and optimize your largest expense categories',
        'Set up automatic savings to build your emergency fund'
      ]
    };
  }

  private getFallbackPersonaQuizSuggestions(persona: string): PersonaQuizSuggestions {
    return {
      persona,
      suggestion: {
        mainSuggestion: this.getDefaultSuggestion(persona),
        suggestedTab: this.getDefaultTab(persona),
        financialQuote: this.getDefaultQuote()
      }
    };
  }

  private getDefaultSuggestion(persona: string): string {
    switch (persona) {
      case 'student':
        return "As a student, focus on tracking your expenses and building good financial habits early. Start by categorizing your spending to identify areas where you can cut back and save.";
      case 'freelancer':
        return "With irregular income as a freelancer, prioritize building an emergency fund and tracking your business expenses. Set aside a percentage of each payment for taxes and savings.";
      case 'salaried':
        return "With a steady income, you're in a great position to build wealth. Focus on budgeting, automating your savings, and investing for long-term goals like retirement.";
      case 'business':
        return "As a business owner, separating personal and business finances is crucial. Track your business expenses carefully and set up a structured accounting system.";
      case 'homemaker':
        return "Managing household finances requires careful budgeting and planning. Focus on tracking family expenses and creating a budget that works for everyone in your household.";
      case 'retiree':
        return "In retirement, preserving your savings while maintaining your lifestyle is key. Focus on tracking expenses carefully and adjusting your budget to ensure your savings last.";
      default:
        return "Start by tracking your daily expenses and setting up a budget. Understanding where your money goes is the first step toward financial freedom.";
    }
  }

  private getDefaultTab(persona: string): string {
    switch (persona) {
      case 'student':
      case 'homemaker':
        return 'expenses';
      case 'freelancer':
      case 'business':
        return 'income';
      case 'salaried':
        return 'savings';
      case 'retiree':
        return 'budgets';
      default:
        return 'expenses';
    }
  }

  private getDefaultQuote(): { text: string; author: string } {
    const quotes = [
      { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
      { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
      { text: "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought.", author: "T.T. Munger" },
      { text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make, so you can give money back and have money to invest.", author: "Dave Ramsey" },
      { text: "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.", author: "Ayn Rand" },
      { text: "The price of anything is the amount of life you exchange for it.", author: "Henry David Thoreau" },
      { text: "It's not how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.", author: "Robert Kiyosaki" },
      { text: "Never spend your money before you have earned it.", author: "Thomas Jefferson" }
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  isConfigured(): boolean {
    // PicaHQ is always configured through Supabase Edge Functions
    return true;
  }

  getProviderName(): string {
    return 'PicaHQ';
  }
}

export const aiService = new AIService();