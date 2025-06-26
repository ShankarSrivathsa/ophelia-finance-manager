import { supabase } from '../lib/supabase';
import { 
  FinancialAdviceRequest, 
  FinancialAdviceResponse,
  BudgetAdjustmentRequest,
  BudgetAdjustmentResponse,
  AutomatedReportRequest,
  AutomatedReportResponse,
  PicaHQError
} from '../types/picahq';

const PICAHQ_BASE_URL = import.meta.env.VITE_PICAHQ_BASE_URL || 'https://api.picahq.com';

class PicaHQService {
  private async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`PicaHQ ${functionName} error:`, error);
      throw error;
    }
  }

  async getFinancialAdvice(request: FinancialAdviceRequest): Promise<FinancialAdviceResponse> {
    return this.callEdgeFunction('financial-advice', request);
  }

  async getBudgetAdjustments(request: BudgetAdjustmentRequest): Promise<BudgetAdjustmentResponse> {
    return this.callEdgeFunction('budget-adjustments', request);
  }

  async generateAutomatedReport(request: AutomatedReportRequest): Promise<AutomatedReportResponse> {
    return this.callEdgeFunction('automated-report', request);
  }

  async getPersonalizedInsights(userId: string): Promise<FinancialAdviceResponse> {
    return this.callEdgeFunction('personalized-insights', { userId });
  }
}

export const picahqService = new PicaHQService();