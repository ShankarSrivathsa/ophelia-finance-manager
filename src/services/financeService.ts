import { supabase } from '../lib/supabase';
import { UserProfile, CustomAccount } from '../types/finance';

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (persona: string): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        persona,
        quiz_completed: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

export const getCustomAccounts = async (): Promise<CustomAccount[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('custom_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting custom accounts:', error);
    return [];
  }
};

export const getAllAccountSuggestions = async (): Promise<Record<string, string[]>> => {
  try {
    const customAccounts = await getCustomAccounts();
    
    const suggestions = {
      revenue: ['Sales Revenue', 'Service Revenue', 'Interest Income', 'Other Income'],
      expense: ['Office Supplies', 'Rent Expense', 'Utilities', 'Marketing', 'Travel', 'Insurance', 'Professional Services'],
      asset: ['Cash', 'Personal Account', 'Accounts Receivable', 'Equipment', 'Inventory'],
      liability: ['Accounts Payable', 'Credit Card', 'Loans Payable'],
      equity: ['Owner\'s Equity', 'Retained Earnings']
    };

    // Add custom accounts to their respective categories
    customAccounts.forEach(account => {
      if (suggestions[account.category]) {
        suggestions[account.category].push(account.name);
      }
    });

    return suggestions;
  } catch (error) {
    console.error('Error getting account suggestions:', error);
    return {
      revenue: ['Sales Revenue', 'Service Revenue', 'Interest Income', 'Other Income'],
      expense: ['Office Supplies', 'Rent Expense', 'Utilities', 'Marketing', 'Travel', 'Insurance', 'Professional Services'],
      asset: ['Cash', 'Personal Account', 'Accounts Receivable', 'Equipment', 'Inventory'],
      liability: ['Accounts Payable', 'Credit Card', 'Loans Payable'],
      equity: ['Owner\'s Equity', 'Retained Earnings']
    };
  }
};