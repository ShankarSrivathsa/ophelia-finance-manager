import { supabase } from '../lib/supabase';
import { Transaction } from '../types/accounting';

export const saveTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save transactions');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      account: transaction.account,
      category: transaction.category
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }

  return data ? {
    id: data.id,
    date: data.date,
    type: data.type,
    amount: data.amount,
    description: data.description,
    account: data.account,
    category: data.category
  } : null;
};

export const loadTransactions = async (): Promise<Transaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error loading transactions:', error);
    throw error;
  }

  return data.map(row => ({
    id: row.id,
    date: row.date,
    type: row.type,
    amount: row.amount,
    description: row.description,
    account: row.account,
    category: row.category
  }));
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const clearAllTransactions = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to clear transactions');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing transactions:', error);
    throw error;
  }
};