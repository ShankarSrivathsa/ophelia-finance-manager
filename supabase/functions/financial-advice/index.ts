import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const requestData: FinancialAdviceRequest = await req.json();
    console.log('Financial advice request:', requestData);

    // Calculate net income and savings rate
    const netIncome = requestData.userProfile.monthlyIncome - requestData.userProfile.monthlyExpenses;
    const savingsRate = requestData.userProfile.monthlyIncome > 0 
      ? ((netIncome / requestData.userProfile.monthlyIncome) * 100) 
      : 0;

    // Generate advice based on financial data
    let advice = "";
    const recommendations = [];
    const insights = [];

    // Basic advice based on savings rate
    if (savingsRate < 10) {
      advice = `Based on your financial data, your savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 10-20%. Focus on reducing expenses and increasing your savings rate to build financial security.`;
      recommendations.push({
        category: "Savings",
        action: "Increase your savings rate to at least 10% of income",
        impact: "Build financial security and emergency fund",
        priority: "high"
      });
      insights.push({
        type: "warning",
        message: `Your current savings rate of ${savingsRate.toFixed(1)}% is below the recommended 10-20%`
      });
    } else if (savingsRate > 30) {
      advice = `Excellent job! Your savings rate is ${savingsRate.toFixed(1)}%, which is well above the recommended 10-20%. Consider investing some of your savings for long-term growth while maintaining your strong financial habits.`;
      insights.push({
        type: "achievement",
        message: `Your savings rate of ${savingsRate.toFixed(1)}% is well above average`
      });
      recommendations.push({
        category: "Investing",
        action: "Consider investing some of your savings for long-term growth",
        impact: "Potential for higher returns than traditional savings accounts",
        priority: "medium"
      });
    } else {
      advice = `You're doing well with a savings rate of ${savingsRate.toFixed(1)}%, which is within the recommended 10-20% range. Continue your good financial habits and look for opportunities to optimize your budget further.`;
      insights.push({
        type: "achievement",
        message: `Your savings rate of ${savingsRate.toFixed(1)}% is within the recommended range`
      });
    }

    // Add persona-specific advice
    if (requestData.userProfile.persona === "student") {
      recommendations.push({
        category: "Education",
        action: "Track education-related expenses separately",
        impact: "Better understand the true cost of your education",
        priority: "medium"
      });
    } else if (requestData.userProfile.persona === "freelancer") {
      recommendations.push({
        category: "Taxes",
        action: "Set aside 25-30% of income for taxes",
        impact: "Avoid tax surprises and penalties",
        priority: "high"
      });
    } else if (requestData.userProfile.persona === "business") {
      recommendations.push({
        category: "Business Finances",
        action: "Separate personal and business expenses",
        impact: "Better financial organization and tax preparation",
        priority: "high"
      });
    }

    // Add spending insights based on transaction data
    const expensesByCategory = {};
    requestData.userProfile.recentTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    // Find top spending category
    let topCategory = "";
    let topAmount = 0;
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      if (amount > topAmount) {
        topCategory = category;
        topAmount = amount as number;
      }
    });

    if (topCategory && topAmount > 0) {
      insights.push({
        type: "opportunity",
        message: `Your highest spending category is ${topCategory} ($${topAmount.toFixed(2)}). Look for ways to optimize these expenses.`
      });
    }

    // Add savings goal insights
    if (requestData.userProfile.savingsGoals.length > 0) {
      const activeGoals = requestData.userProfile.savingsGoals.filter(goal => goal.currentAmount < goal.targetAmount);
      if (activeGoals.length > 0) {
        const totalNeeded = activeGoals.reduce((sum, goal) => sum + (goal.targetAmount - goal.currentAmount), 0);
        recommendations.push({
          category: "Savings Goals",
          action: `Focus on your ${activeGoals.length} active savings goals`,
          impact: `Reach your financial targets totaling $${totalNeeded.toFixed(2)}`,
          priority: "medium"
        });
      }
    }

    // Response object
    const response = {
      advice,
      recommendations,
      insights
    };

    console.log('Financial advice response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Financial advice error:", error);
    
    // Fallback response
    const fallbackResponse = {
      advice: "I'm currently analyzing your financial data to provide personalized advice. Based on general best practices, focus on tracking your expenses and maintaining a budget.",
      recommendations: [
        {
          category: "Budgeting",
          action: "Create and maintain a monthly budget",
          impact: "Better control over your finances",
          priority: "high"
        },
        {
          category: "Emergency Fund",
          action: "Build an emergency fund covering 3-6 months of expenses",
          impact: "Financial security and peace of mind",
          priority: "high"
        }
      ],
      insights: [
        {
          type: "opportunity",
          message: "Regular expense tracking can help identify areas for savings"
        }
      ]
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});