import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('Automated report request:', requestData);

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
        
        if (savingsGoals.length > 0) {
          sections.push({
            title: "Savings Goals Progress",
            content: `You have ${savingsGoals.length} active savings goals. ${savingsGoals.map(goal => {
              const progress = goal.current_amount / goal.target_amount * 100;
              return `${goal.name}: ${progress.toFixed(1)}% complete`;
            }).join('. ')}`
          });
        }
        
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
          },
          {
            name: "Top Expense Category",
            value: sortedCategories.length > 0 ? sortedCategories[0].category : "None",
            trend: "stable",
            significance: sortedCategories.length > 0 ? `$${sortedCategories[0].amount.toFixed(2)} spent` : "No expenses recorded"
          }
        );
        
        if (requestData.includeRecommendations) {
          recommendations.push(
            "Review your top spending categories to identify potential savings",
            "Set up automatic transfers to your savings account on payday",
            "Track your expenses regularly to stay within your budget"
          );
          
          if (savingsRate < 10) {
            recommendations.push("Focus on increasing your savings rate to at least 10% of income");
          }
          
          if (sortedCategories.length > 0 && sortedCategories[0].amount > totalIncome * 0.3) {
            recommendations.push(`Consider reducing spending in ${sortedCategories[0].category} as it represents a large portion of your income`);
          }
        }
        break;
        
      case 'spending_analysis':
        reportTitle = "Detailed Spending Analysis Report";
        summary = `This analysis examines your spending patterns from ${requestData.dateRange.startDate} to ${requestData.dateRange.endDate}. You spent a total of $${totalExpenses.toFixed(2)} across ${Object.keys(spendingByCategory).length} categories.`;
        
        sections.push({
          title: "Category Breakdown",
          content: `Your spending was distributed across ${Object.keys(spendingByCategory).length} categories. ${sortedCategories.length > 0 ? `The top categories were ${sortedCategories.slice(0, 3).map(cat => `${cat.category} (${((cat.amount / totalExpenses) * 100).toFixed(1)}%)`).join(', ')}.` : 'No spending recorded.'}`
        });
        
        if (sortedCategories.length > 0) {
          sections.push({
            title: "Spending Patterns",
            content: `Your highest spending category, ${sortedCategories[0].category}, accounts for ${((sortedCategories[0].amount / totalExpenses) * 100).toFixed(1)}% of your total expenses. ${sortedCategories.length > 1 ? `Your second highest category, ${sortedCategories[1].category}, represents ${((sortedCategories[1].amount / totalExpenses) * 100).toFixed(1)}% of spending.` : ''}`
          });
        }
        
        keyMetrics.push(
          {
            name: "Total Expenses",
            value: `$${totalExpenses.toFixed(2)}`,
            trend: "stable",
            significance: "Total spending for the period"
          },
          {
            name: "Categories Used",
            value: Object.keys(spendingByCategory).length.toString(),
            trend: "stable",
            significance: "Number of expense categories"
          },
          {
            name: "Average Daily Spending",
            value: `$${(totalExpenses / Math.max(1, Math.ceil((new Date(requestData.dateRange.endDate).getTime() - new Date(requestData.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)}`,
            trend: "stable",
            significance: "Daily spending average"
          }
        );
        
        if (requestData.includeRecommendations) {
          recommendations.push(
            "Identify your top 3 spending categories and look for optimization opportunities",
            "Set specific budgets for your highest spending categories",
            "Track daily expenses to maintain awareness of spending patterns"
          );
        }
        break;
        
      case 'savings_progress':
        reportTitle = "Savings Progress Report";
        summary = `This report tracks your progress toward your savings goals as of ${requestData.dateRange.endDate}. ${savingsGoals.length > 0 ? `You have ${savingsGoals.length} active savings goals with a combined target of $${savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0).toFixed(2)}.` : 'You currently have no active savings goals.'}`;
        
        if (savingsGoals.length > 0) {
          sections.push({
            title: "Goals Overview",
            content: `You have ${savingsGoals.length} active savings goals. ${savingsGoals.map(goal => {
              const progress = goal.current_amount / goal.target_amount * 100;
              const remaining = goal.target_amount - goal.current_amount;
              return `${goal.name}: ${progress.toFixed(1)}% complete ($${goal.current_amount.toFixed(2)}/$${goal.target_amount.toFixed(2)}) - $${remaining.toFixed(2)} remaining`;
            }).join('. ')}`
          });
          
          const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
          const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
          const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
          
          sections.push({
            title: "Overall Progress",
            content: `Across all your savings goals, you have saved $${totalSaved.toFixed(2)} out of your total target of $${totalTarget.toFixed(2)}, representing ${overallProgress.toFixed(1)}% completion.`
          });
          
          keyMetrics.push(
            {
              name: "Total Saved",
              value: `$${totalSaved.toFixed(2)}`,
              trend: "up",
              significance: "Amount saved across all goals"
            },
            {
              name: "Overall Progress",
              value: `${overallProgress.toFixed(1)}%`,
              trend: overallProgress > 50 ? "up" : "stable",
              significance: "Progress toward all savings goals"
            },
            {
              name: "Active Goals",
              value: savingsGoals.length.toString(),
              trend: "stable",
              significance: "Number of active savings goals"
            }
          );
        } else {
          sections.push({
            title: "Goals Overview",
            content: "You don't have any active savings goals. Consider setting up specific savings goals to track your progress and stay motivated."
          });
          
          keyMetrics.push(
            {
              name: "Active Goals",
              value: "0",
              trend: "stable",
              significance: "No savings goals set"
            }
          );
        }
        
        if (requestData.includeRecommendations) {
          if (savingsGoals.length === 0) {
            recommendations.push(
              "Set up your first savings goal to start building wealth",
              "Consider creating an emergency fund as your first goal",
              "Start with a small, achievable goal to build momentum"
            );
          } else {
            recommendations.push(
              "Continue making regular contributions to your savings goals",
              "Consider increasing contributions if your budget allows",
              "Celebrate milestones to stay motivated"
            );
          }
        }
        break;
        
      case 'financial_health':
        reportTitle = "Financial Health Assessment";
        summary = `This assessment evaluates your overall financial health based on data from ${requestData.dateRange.startDate} to ${requestData.dateRange.endDate}. Your financial health score is based on savings rate, expense management, and goal progress.`;
        
        // Calculate financial health score
        let healthScore = 0;
        const healthFactors = [];
        
        // Savings rate factor (40% of score)
        if (savingsRate >= 20) {
          healthScore += 40;
          healthFactors.push("Excellent savings rate");
        } else if (savingsRate >= 10) {
          healthScore += 25;
          healthFactors.push("Good savings rate");
        } else if (savingsRate >= 0) {
          healthScore += 10;
          healthFactors.push("Positive cash flow");
        } else {
          healthFactors.push("Negative cash flow");
        }
        
        // Budget adherence factor (30% of score)
        if (budgets.length > 0) {
          const budgetAdherence = budgets.filter(budget => {
            const spent = expenses.filter(exp => exp.category === budget.category).reduce((sum, exp) => sum + exp.amount, 0);
            return spent <= budget.amount;
          }).length / budgets.length;
          
          if (budgetAdherence >= 0.8) {
            healthScore += 30;
            healthFactors.push("Excellent budget adherence");
          } else if (budgetAdherence >= 0.6) {
            healthScore += 20;
            healthFactors.push("Good budget adherence");
          } else {
            healthScore += 10;
            healthFactors.push("Room for budget improvement");
          }
        } else {
          healthScore += 15;
          healthFactors.push("No budgets set");
        }
        
        // Savings goals factor (30% of score)
        if (savingsGoals.length > 0) {
          const avgProgress = savingsGoals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount), 0) / savingsGoals.length;
          if (avgProgress >= 0.5) {
            healthScore += 30;
            healthFactors.push("Good progress on savings goals");
          } else if (avgProgress >= 0.25) {
            healthScore += 20;
            healthFactors.push("Making progress on savings goals");
          } else {
            healthScore += 10;
            healthFactors.push("Early stages of savings goals");
          }
        } else {
          healthFactors.push("No savings goals set");
        }
        
        sections.push({
          title: "Financial Health Score",
          content: `Your financial health score is ${healthScore}/100. ${healthScore >= 80 ? 'Excellent financial health!' : healthScore >= 60 ? 'Good financial health with room for improvement.' : healthScore >= 40 ? 'Fair financial health - focus on key areas for improvement.' : 'Your financial health needs attention - consider implementing basic financial practices.'}`
        });
        
        sections.push({
          title: "Key Health Factors",
          content: `Your financial health is based on: ${healthFactors.join(', ')}.`
        });
        
        keyMetrics.push(
          {
            name: "Health Score",
            value: `${healthScore}/100`,
            trend: healthScore >= 70 ? "up" : healthScore >= 50 ? "stable" : "down",
            significance: healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Improvement"
          },
          {
            name: "Savings Rate",
            value: `${savingsRate.toFixed(1)}%`,
            trend: savingsRate >= 15 ? "up" : savingsRate >= 5 ? "stable" : "down",
            significance: "Percentage of income saved"
          }
        );
        
        if (requestData.includeRecommendations) {
          if (healthScore < 50) {
            recommendations.push(
              "Start by creating a basic budget to track income and expenses",
              "Focus on achieving positive cash flow",
              "Set up an emergency fund as your first savings goal"
            );
          } else if (healthScore < 80) {
            recommendations.push(
              "Work on increasing your savings rate to 15-20%",
              "Improve budget adherence in overspending categories",
              "Set specific, measurable financial goals"
            );
          } else {
            recommendations.push(
              "Maintain your excellent financial habits",
              "Consider advanced strategies like investing",
              "Help others by sharing your financial knowledge"
            );
          }
        }
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

    console.log('Automated report response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automated report error:", error);
    
    // Fallback response
    const fallbackResponse = {
      reportTitle: "Financial Report",
      summary: "Report generation temporarily unavailable. Please try again later.",
      sections: [{
        title: "Service Notice",
        content: "We're currently unable to generate your custom report. Please try again later or contact support if the issue persists."
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