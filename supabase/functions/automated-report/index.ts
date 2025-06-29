import { serve } from "npm:@deno/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const requestData: AutomatedReportRequest = await req.json();

    // Fetch user's financial data from Supabase
    const [expensesData, incomeData, savingsData, budgetsData, profileData] = await Promise.all([
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
        .eq('user_id', user.id),
      supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
    ]);

    const expenses = expensesData.data || [];
    const income = incomeData.data || [];
    const savingsGoals = savingsData.data || [];
    const budgets = budgetsData.data || [];
    const profile = profileData.data;

    // Calculate financial metrics
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Calculate spending by category
    const spendingByCategory = {};
    expenses.forEach(expense => {
      spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + expense.amount;
    });

    // Sort categories by spending amount
    const sortedCategories = Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));

    // Generate report based on type
    let reportTitle = "";
    let summary = "";
    const sections = [];
    const keyMetrics = [];
    const recommendations = [];

    switch (requestData.reportType) {
      case 'monthly_summary':
        reportTitle = `Monthly Financial Summary: ${new Date(requestData.dateRange.startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        summary = `During this period, you earned $${totalIncome.toFixed(2)} and spent $${totalExpenses.toFixed(2)}, resulting in a net ${netIncome >= 0 ? 'income' : 'loss'} of $${Math.abs(netIncome).toFixed(2)}. Your savings rate was ${savingsRate.toFixed(1)}%.`;
        
        sections.push({
          title: "Income Overview",
          content: `Your total income for this period was $${totalIncome.toFixed(2)}. ${income.length > 0 ? `Your primary income sources were ${income.slice(0, 3).map(inc => inc.category).join(', ')}.` : 'No income sources recorded for this period.'}`
        });
        
        sections.push({
          title: "Expense Breakdown",
          content: `Your total expenses were $${totalExpenses.toFixed(2)}. ${sortedCategories.length > 0 ? `Your top spending categories were ${sortedCategories.slice(0, 3).map(cat => `${cat.category} ($${cat.amount.toFixed(2)})`).join(', ')}.` : 'No expenses recorded for this period.'}`
        });
        
        keyMetrics.push(
          {
            name: "Net Income",
            value: `$${netIncome.toFixed(2)}`,
            trend: netIncome > 0 ? "up" : "down",
            significance: netIncome > 0 ? "Positive cash flow" : "Spending exceeds income"
          },
          {
            name: "Savings Rate",
            value: `${savingsRate.toFixed(1)}%`,
            trend: savingsRate >= 20 ? "up" : savingsRate >= 10 ? "stable" : "down",
            significance: savingsRate >= 20 ? "Excellent savings rate" : savingsRate >= 10 ? "Healthy savings rate" : "Below recommended savings rate"
          }
        );
        
        recommendations.push(
          "Review your top spending categories to identify potential savings",
          "Set up automatic transfers to your savings account on payday",
          "Track your expenses regularly to stay within your budget"
        );
        break;
        
      case 'spending_analysis':
        // Implementation for spending analysis report
        reportTitle = "Spending Analysis Report";
        summary = `This analysis examines your spending patterns from ${requestData.dateRange.startDate} to ${requestData.dateRange.endDate}.`;
        
        sections.push({
          title: "Category Breakdown",
          content: `Your spending was distributed across ${Object.keys(spendingByCategory).length} categories. The top categories were ${sortedCategories.slice(0, 3).map(cat => `${cat.category} (${((cat.amount / totalExpenses) * 100).toFixed(1)}%)`).join(', ')}.`
        });
        
        // Add more sections, metrics, and recommendations specific to spending analysis
        break;
        
      case 'savings_progress':
        // Implementation for savings progress report
        reportTitle = "Savings Progress Report";
        summary = `This report tracks your progress toward your savings goals as of ${requestData.dateRange.endDate}.`;
        
        if (savingsGoals.length > 0) {
          sections.push({
            title: "Goals Overview",
            content: `You have ${savingsGoals.length} active savings goals. ${savingsGoals.map(goal => {
              const progress = goal.current_amount / goal.target_amount * 100;
              return `${goal.name}: ${progress.toFixed(1)}% complete ($${goal.current_amount.toFixed(2)}/$${goal.target_amount.toFixed(2)})`;
            }).join('. ')}`
          });
        } else {
          sections.push({
            title: "Goals Overview",
            content: "You don't have any active savings goals. Consider setting up specific savings goals to track your progress."
          });
        }
        
        // Add more sections, metrics, and recommendations specific to savings progress
        break;
        
      case 'financial_health':
        // Implementation for financial health report
        reportTitle = "Financial Health Assessment";
        summary = `This assessment evaluates your overall financial health based on data from ${requestData.dateRange.startDate} to ${requestData.dateRange.endDate}.`;
        
        // Calculate debt-to-income ratio (simplified)
        const dti = 0.3; // Placeholder value
        
        sections.push({
          title: "Financial Ratios",
          content: `Your savings rate is ${savingsRate.toFixed(1)}%. A healthy savings rate is typically 15-20% of income. ${savingsRate >= 15 ? 'You are meeting or exceeding this target.' : 'You may want to increase your savings rate if possible.'}`
        });
        
        // Add more sections, metrics, and recommendations specific to financial health
        break;
    }

    // Response object
    const response = {
      reportTitle,
      summary,
      sections,
      keyMetrics,
      recommendations
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automated report error:", error);
    
    // Fallback response
    const fallbackResponse = {
      reportTitle: "Financial Report",
      summary: "Report generation temporarily unavailable.",
      sections: [{
        title: "Service Notice",
        content: "We're currently unable to generate your custom report. Please try again later."
      }],
      keyMetrics: [],
      recommendations: [
        "Continue tracking your income and expenses regularly",
        "Review your budget categories to ensure they match your spending patterns",
        "Set specific, measurable financial goals"
      ]
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});