import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const requestData: BudgetAdjustmentRequest = await req.json();
    console.log('Budget adjustment request:', requestData);

    // Generate budget adjustments
    const adjustments = [];
    let totalSavings = 0;

    // Find categories where spending exceeds budget
    for (const budget of requestData.currentBudgets) {
      if (budget.spent > budget.budgeted) {
        // Suggest increasing budget to match spending with a 10% buffer
        const suggestedAmount = Math.ceil(budget.spent * 1.1);
        adjustments.push({
          category: budget.category,
          currentAmount: budget.budgeted,
          suggestedAmount,
          reasoning: `Your spending in ${budget.category} consistently exceeds your budget. Increasing to $${suggestedAmount} will help you maintain a realistic budget.`,
          confidence: 0.85
        });
        
        // This is technically a negative saving (increased budget)
        totalSavings -= (suggestedAmount - budget.budgeted);
      } 
      // Find categories where spending is significantly under budget
      else if (budget.spent < budget.budgeted * 0.7 && budget.budgeted > 50) {
        // Suggest decreasing budget to match spending with a 20% buffer
        const suggestedAmount = Math.ceil(budget.spent * 1.2);
        adjustments.push({
          category: budget.category,
          currentAmount: budget.budgeted,
          suggestedAmount,
          reasoning: `You consistently spend less than budgeted in ${budget.category}. You could reallocate $${(budget.budgeted - suggestedAmount).toFixed(2)} to savings or other categories.`,
          confidence: 0.75
        });
        
        // This is a positive saving (decreased budget)
        totalSavings += (budget.budgeted - suggestedAmount);
      }
    }

    // Check for missing budget categories based on spending patterns
    for (const pattern of requestData.spendingPatterns) {
      const hasBudget = requestData.currentBudgets.some(b => b.category === pattern.category);
      if (!hasBudget && pattern.averageMonthly > 50) {
        adjustments.push({
          category: pattern.category,
          currentAmount: 0,
          suggestedAmount: Math.ceil(pattern.averageMonthly * 1.1),
          reasoning: `You regularly spend $${pattern.averageMonthly.toFixed(2)} on ${pattern.category} but don't have a budget for it. Adding this category will help you track these expenses.`,
          confidence: 0.8
        });
      }
    }

    // Generate impact analysis
    let impactAnalysis = "";
    if (adjustments.length === 0) {
      impactAnalysis = "Your budgets are well-aligned with your spending patterns. No major adjustments are needed at this time. Consider minor optimizations to increase savings.";
    } else if (totalSavings > 0) {
      impactAnalysis = `The suggested adjustments could free up $${totalSavings.toFixed(2)} monthly that you could allocate to savings or other financial goals. This represents a ${((totalSavings / requestData.currentBudgets.reduce((sum, b) => sum + b.budgeted, 0)) * 100).toFixed(1)}% optimization of your budget.`;
    } else if (totalSavings < 0) {
      impactAnalysis = `The suggested adjustments will increase your total budget by $${Math.abs(totalSavings).toFixed(2)} to better reflect your actual spending patterns. This will help you maintain realistic budgets and reduce financial stress.`;
    } else {
      impactAnalysis = "The suggested adjustments will make your budget more realistic and help you better track your finances without significantly changing your total budget.";
    }

    // Response object
    const response = {
      adjustments,
      totalSavings: Math.max(0, totalSavings), // Only show positive savings
      impactAnalysis
    };

    console.log('Budget adjustment response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Budget adjustment error:", error);
    
    // Fallback response
    const fallbackResponse = {
      adjustments: [],
      totalSavings: 0,
      impactAnalysis: "Unable to generate specific budget adjustments at this time. Consider reviewing your spending patterns and adjusting budgets for categories where you consistently overspend."
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});