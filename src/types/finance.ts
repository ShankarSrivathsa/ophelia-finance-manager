export interface UserProfile {
  id: string;
  user_id: string;
  persona: 'student' | 'freelancer' | 'salaried' | 'business' | 'homemaker' | 'retiree' | null;
  quiz_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomAccount {
  id: string;
  user_id: string;
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string; // Format: YYYY-MM
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  date: string;
  created_at: string;
}

export interface SavingsAnalysis {
  totalSaved: number;
  monthlyAverage: number;
  savingsRate: number;
  goalProgress: {
    goalId: string;
    goalName: string;
    progress: number;
    remaining: number;
    daysLeft: number;
    onTrack: boolean;
  }[];
  monthlyTrend: {
    month: string;
    saved: number;
    income: number;
    expenses: number;
    savingsRate: number;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  personas: string[];
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'under' | 'over' | 'on-track';
}

export interface SpendingInsight {
  type: 'increase' | 'decrease' | 'warning' | 'achievement';
  message: string;
  category?: string;
  percentage?: number;
}

export interface PersonaSuggestion {
  mainSuggestion: string;
  suggestedTab: string;
  financialQuote: {
    text: string;
    author: string;
  };
}

export interface PersonaQuizSuggestions {
  persona: string;
  suggestion: PersonaSuggestion;
}