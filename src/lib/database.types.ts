export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'debit' | 'credit'
          amount: number
          description: string
          account: string
          category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'debit' | 'credit'
          amount: number
          description: string
          account: string
          category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'debit' | 'credit'
          amount?: number
          description?: string
          account?: string
          category?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          persona: 'student' | 'freelancer' | 'salaried' | 'business' | 'homemaker' | 'retiree' | null
          quiz_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona?: 'student' | 'freelancer' | 'salaried' | 'business' | 'homemaker' | 'retiree' | null
          quiz_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona?: 'student' | 'freelancer' | 'salaried' | 'business' | 'homemaker' | 'retiree' | null
          quiz_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description: string
          date: string
          notes: string | null
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description: string
          date: string
          notes?: string | null
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          description?: string
          date?: string
          notes?: string | null
          is_recurring?: boolean
          created_at?: string
        }
      }
      income: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description: string
          date: string
          notes: string | null
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description: string
          date: string
          notes?: string | null
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          description?: string
          date?: string
          notes?: string | null
          is_recurring?: boolean
          created_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string
          category: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date: string
          category: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string
          category?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      savings_transactions: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          amount: number
          type: 'deposit' | 'withdrawal'
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          amount: number
          type: 'deposit' | 'withdrawal'
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          amount?: number
          type?: 'deposit' | 'withdrawal'
          description?: string
          date?: string
          created_at?: string
        }
      }
      generated_videos: {
        Row: {
          id: string
          user_id: string
          video_id: string
          video_type: 'onboarding' | 'celebration' | 'report' | 'custom'
          video_url: string | null
          thumbnail_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          script: string | null
          duration: number | null
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          video_type: 'onboarding' | 'celebration' | 'report' | 'custom'
          video_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          script?: string | null
          duration?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          video_type?: 'onboarding' | 'celebration' | 'report' | 'custom'
          video_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          script?: string | null
          duration?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}