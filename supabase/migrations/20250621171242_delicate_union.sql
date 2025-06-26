/*
  # Add savings tracking tables

  1. New Tables
    - `savings_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, goal name)
      - `target_amount` (numeric, target amount to save)
      - `current_amount` (numeric, current saved amount)
      - `target_date` (date, when to achieve the goal)
      - `category` (text, type of savings goal)
      - `description` (text, optional description)
      - `is_active` (boolean, whether goal is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `savings_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `goal_id` (uuid, foreign key to savings_goals)
      - `amount` (numeric, transaction amount)
      - `type` (text, 'deposit' or 'withdrawal')
      - `description` (text, transaction description)
      - `date` (date, transaction date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(10,2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(10,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date date NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create savings_transactions table
CREATE TABLE IF NOT EXISTS savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  description text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS savings_goals_target_date_idx ON savings_goals(target_date);
CREATE INDEX IF NOT EXISTS savings_transactions_user_id_idx ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS savings_transactions_goal_id_idx ON savings_transactions(goal_id);
CREATE INDEX IF NOT EXISTS savings_transactions_date_idx ON savings_transactions(date);

-- Create RLS policies for savings_goals
CREATE POLICY "Users can view their own savings goals"
  ON savings_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
  ON savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
  ON savings_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
  ON savings_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for savings_transactions
CREATE POLICY "Users can view their own savings transactions"
  ON savings_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings transactions"
  ON savings_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings transactions"
  ON savings_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings transactions"
  ON savings_transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at on savings_goals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();