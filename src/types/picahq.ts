export interface FinancialAdviceRequest {
  userId: string;
  userProfile: {
    persona: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsGoals: Array<{
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
    }>;
    recentTransactions: Array<{
      amount: number;
      category: string;
      date: string;
      type: 'income' | 'expense';
    }>;
  };
  requestType: 'general_advice' | 'budget_optimization' | 'savings_strategy' | 'expense_analysis';
}

export interface FinancialAdviceResponse {
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

export interface BudgetAdjustmentRequest {
  userId: string;
  currentBudgets: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }>;
  spendingPatterns: Array<{
    category: string;
    averageMonthly: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  financialGoals: Array<{
    name: string;
    targetAmount: number;
    timeframe: string;
  }>;
}

export interface BudgetAdjustmentResponse {
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

export interface AutomatedReportRequest {
  userId: string;
  reportType: 'monthly_summary' | 'spending_analysis' | 'savings_progress' | 'financial_health';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeCharts: boolean;
  includeRecommendations: boolean;
}

export interface AutomatedReportResponse {
  reportTitle: string;
  summary: string;
  sections: Array<{
    title: string;
    content: string;
    data?: any;
    chartConfig?: any;
  }>;
  keyMetrics: Array<{
    name: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    significance: string;
  }>;
  recommendations: string[];
}