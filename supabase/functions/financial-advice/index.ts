import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FinancialAdviceRequest {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const requestData: FinancialAdviceRequest = await req.json()

    // Prepare data for PicaHQ AI Agent
    const picahqPayload = {
      user_id: requestData.userId,
      persona: requestData.userProfile.persona,
      financial_data: {
        monthly_income: requestData.userProfile.monthlyIncome,
        monthly_expenses: requestData.userProfile.monthlyExpenses,
        net_income: requestData.userProfile.monthlyIncome - requestData.userProfile.monthlyExpenses,
        savings_rate: requestData.userProfile.monthlyIncome > 0 
          ? ((requestData.userProfile.monthlyIncome - requestData.userProfile.monthlyExpenses) / requestData.userProfile.monthlyIncome) * 100 
          : 0,
        savings_goals: requestData.userProfile.savingsGoals,
        recent_transactions: requestData.userProfile.recentTransactions
      },
      request_type: requestData.requestType,
      context: {
        timestamp: new Date().toISOString(),
        request_source: 'money_manager_app'
      }
    }

    // Call PicaHQ API
    const picahqApiKey = Deno.env.get('PICAHQ_API_KEY')
    if (!picahqApiKey) {
      throw new Error('PicaHQ API key not configured')
    }

    const picahqResponse = await fetch('https://api.picahq.com/v1/agents/financial-advisor/invoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${picahqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(picahqPayload)
    })

    if (!picahqResponse.ok) {
      throw new Error(`PicaHQ API error: ${picahqResponse.status}`)
    }

    const picahqData = await picahqResponse.json()

    // Process and format the response
    const response = {
      advice: picahqData.advice || generateFallbackAdvice(requestData),
      recommendations: picahqData.recommendations || [],
      insights: picahqData.insights || []
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Financial advice error:', error)
    
    // Fallback response
    const fallbackResponse = {
      advice: "I'm currently unable to provide personalized advice. Please try again later.",
      recommendations: [],
      insights: [{
        type: 'warning',
        message: 'AI advisor temporarily unavailable'
      }]
    }

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateFallbackAdvice(request: FinancialAdviceRequest): string {
  const { userProfile } = request
  const savingsRate = userProfile.monthlyIncome > 0 
    ? ((userProfile.monthlyIncome - userProfile.monthlyExpenses) / userProfile.monthlyIncome) * 100 
    : 0

  if (savingsRate < 10) {
    return "Focus on reducing expenses and increasing your savings rate. Aim to save at least 10-20% of your income."
  } else if (savingsRate > 30) {
    return "Excellent savings rate! Consider investing some of your savings for long-term growth."
  } else {
    return "You're on a good track with your savings. Consider reviewing your budget to optimize spending categories."
  }
}