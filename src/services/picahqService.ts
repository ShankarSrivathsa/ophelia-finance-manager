import { supabase } from '../lib/supabase';
import { 
  FinancialAdviceRequest, 
  FinancialAdviceResponse,
  BudgetAdjustmentRequest,
  BudgetAdjustmentResponse,
  AutomatedReportRequest,
  AutomatedReportResponse
} from '../types/picahq';

class PicaHQService {
  private async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      console.log(`Calling edge function: ${functionName}`, payload);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log(`Edge function ${functionName} response:`, data);
      return data;
    } catch (error) {
      console.error(`PicaHQ ${functionName} error:`, error);
      throw error;
    }
  }

  async getFinancialAdvice(request: FinancialAdviceRequest): Promise<FinancialAdviceResponse> {
    try {
      return await this.callEdgeFunction('financial-advice', request);
    } catch (error) {
      console.error('Failed to get financial advice:', error);
      // Return a fallback response
      return {
        advice: "Based on your financial data, I recommend focusing on tracking your expenses and setting up a budget. Understanding where your money goes is the first step toward financial freedom.",
        recommendations: [
          {
            category: "Budgeting",
            action: "Create a monthly budget for all expense categories",
            impact: "Better control over spending and increased savings",
            priority: "high"
          },
          {
            category: "Savings",
            action: "Set up automatic transfers to a savings account",
            impact: "Build emergency fund and reach financial goals faster",
            priority: "medium"
          }
        ],
        insights: [
          {
            type: "opportunity",
            message: "Setting up a budget could help you save more each month"
          }
        ]
      };
    }
  }

  async getBudgetAdjustments(request: BudgetAdjustmentRequest): Promise<BudgetAdjustmentResponse> {
    try {
      return await this.callEdgeFunction('budget-adjustments', request);
    } catch (error) {
      console.error('Failed to get budget adjustments:', error);
      // Return a fallback response
      return {
        adjustments: request.currentBudgets
          .filter(budget => budget.spent > budget.budgeted)
          .map(budget => ({
            category: budget.category,
            currentAmount: budget.budgeted,
            suggestedAmount: Math.ceil(budget.spent * 1.1), // 10% buffer
            reasoning: "Increase budget to accommodate actual spending patterns",
            confidence: 0.7
          })),
        totalSavings: 0,
        impactAnalysis: "Adjusting your budget to match your actual spending patterns will help you maintain realistic financial goals."
      };
    }
  }

  async generateAutomatedReport(request: AutomatedReportRequest): Promise<AutomatedReportResponse> {
    try {
      return await this.callEdgeFunction('automated-report', request);
    } catch (error) {
      console.error('Failed to generate automated report:', error);
      // Return a fallback response
      const reportDate = new Date().toLocaleDateString();
      return {
        reportTitle: `${request.reportType.replace('_', ' ').toUpperCase()} Financial Report`,
        summary: `This report covers the period from ${request.dateRange.startDate} to ${request.dateRange.endDate}. It provides an overview of your financial activity during this timeframe.`,
        sections: [
          {
            title: "Overview",
            content: "This report provides a summary of your financial activity for the selected period. Due to technical limitations, we're showing a simplified version of the report."
          },
          {
            title: "Recommendations",
            content: "Based on your financial data, we recommend reviewing your spending patterns and setting up a budget to better track your expenses."
          }
        ],
        keyMetrics: [
          {
            name: "Report Status",
            value: "Simplified",
            trend: "stable",
            significance: "This is a simplified report due to technical limitations"
          }
        ],
        recommendations: [
          "Review your spending patterns to identify areas for improvement",
          "Set up a budget to better track your expenses",
          "Consider setting up automatic savings to reach your financial goals"
        ]
      };
    }
  }

  async getPersonalizedInsights(userId: string): Promise<FinancialAdviceResponse> {
    try {
      return await this.callEdgeFunction('personalized-insights', { userId });
    } catch (error) {
      console.error('Failed to get personalized insights:', error);
      // Return a fallback response
      return {
        advice: "Based on your financial data, I recommend focusing on tracking your expenses and setting up a budget.",
        recommendations: [
          {
            category: "Budgeting",
            action: "Create a monthly budget for all expense categories",
            impact: "Better control over spending and increased savings",
            priority: "high"
          }
        ],
        insights: [
          {
            type: "opportunity",
            message: "Setting up a budget could help you save more each month"
          }
        ]
      };
    }
  }
}

export const picahqService = new PicaHQService();