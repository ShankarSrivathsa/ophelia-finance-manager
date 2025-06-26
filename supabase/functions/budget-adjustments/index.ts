import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BudgetAdjustmentRequest {
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

    const requestData: BudgetAdjustmentRequest = await req.json()

    // Prepare data for PicaHQ AI Agent
    const picahqPayload = {
      user_id: requestData.userId,
      budget_analysis: {
        current_budgets: requestData.currentBudgets,
        spending_patterns: requestData.spendingPatterns,
        financial_goals: requestData.financialGoals,
        total_budgeted: requestData.currentBudgets.reduce((sum, b) => sum + b.budgeted, 0),
        total_spent: requestData.currentBudgets.reduce((sum, b) => sum + b.spent, 0),
        categories_over_budget: requestData.currentBudgets.filter(b => b.spent > b.budgeted).length
      },
      optimization_goals: [
        'reduce_overspending',
        'align_with_financial_goals',
        'improve_savings_rate',
        'balance_categories'
      ]
    }

    // Call PicaHQ API
    const picahqApiKey = Deno.env.get('PICAHQ_API_KEY')
    if (!picahqApiKey) {
      throw new Error('PicaHQ API key not configured')
    }

    const picahqResponse = await fetch('https://api.picahq.com/v1/agents/budget-optimizer/invoke', {
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
      adjustments: picahqData.adjustments || generateFallbackAdjustments(requestData),
      totalSavings: picahqData.total_savings || 0,
      impactAnalysis: picahqData.impact_analysis || "Budget adjustments will help optimize your spending."
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Budget adjustment error:', error)
    
    // Fallback response
    const fallbackResponse = {
      adjustments: [],
      totalSavings: 0,
      impactAnalysis: "Unable to generate budget adjustments at this time."
    }

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateFallbackAdjustments(request: BudgetAdjustmentRequest) {
  return request.currentBudgets
    .filter(budget => budget.spent > budget.budgeted)
    .map(budget => ({
      category: budget.category,
      currentAmount: budget.budgeted,
      suggestedAmount: Math.ceil(budget.spent * 1.1), // 10% buffer
      reasoning: `Increase budget to accommodate actual spending patterns`,
      confidence: 0.7
    }))
}