import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AutomatedReportRequest {
  userId: string;
  reportType: 'monthly_summary' | 'spending_analysis' | 'savings_progress' | 'financial_health';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeCharts: boolean;
  includeRecommendations: boolean;
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

    const requestData: AutomatedReportRequest = await req.json()

    // Fetch user's financial data from Supabase
    const [expensesData, incomeData, savingsData, budgetsData] = await Promise.all([
      supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', requestData.dateRange.startDate)
        .lte('date', requestData.dateRange.endDate),
      supabaseClient
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', requestData.dateRange.startDate)
        .lte('date', requestData.dateRange.endDate),
      supabaseClient
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id),
      supabaseClient
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
    ])

    // Prepare data for PicaHQ AI Agent
    const picahqPayload = {
      user_id: requestData.userId,
      report_type: requestData.reportType,
      date_range: requestData.dateRange,
      financial_data: {
        expenses: expensesData.data || [],
        income: incomeData.data || [],
        savings_goals: savingsData.data || [],
        budgets: budgetsData.data || []
      },
      report_options: {
        include_charts: requestData.includeCharts,
        include_recommendations: requestData.includeRecommendations
      }
    }

    // Call PicaHQ API
    const picahqApiKey = Deno.env.get('PICAHQ_API_KEY')
    if (!picahqApiKey) {
      throw new Error('PicaHQ API key not configured')
    }

    const picahqResponse = await fetch('https://api.picahq.com/v1/agents/report-generator/invoke', {
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
      reportTitle: picahqData.report_title || `${requestData.reportType.replace('_', ' ').toUpperCase()} Report`,
      summary: picahqData.summary || generateFallbackSummary(requestData, picahqPayload.financial_data),
      sections: picahqData.sections || [],
      keyMetrics: picahqData.key_metrics || [],
      recommendations: picahqData.recommendations || []
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Automated report error:', error)
    
    // Fallback response
    const fallbackResponse = {
      reportTitle: "Financial Report",
      summary: "Report generation temporarily unavailable.",
      sections: [],
      keyMetrics: [],
      recommendations: []
    }

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateFallbackSummary(request: AutomatedReportRequest, financialData: any): string {
  const totalExpenses = financialData.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
  const totalIncome = financialData.income.reduce((sum: number, inc: any) => sum + inc.amount, 0)
  const netIncome = totalIncome - totalExpenses

  return `During the period from ${request.dateRange.startDate} to ${request.dateRange.endDate}, you had a total income of $${totalIncome.toFixed(2)} and expenses of $${totalExpenses.toFixed(2)}, resulting in a net ${netIncome >= 0 ? 'income' : 'loss'} of $${Math.abs(netIncome).toFixed(2)}.`
}