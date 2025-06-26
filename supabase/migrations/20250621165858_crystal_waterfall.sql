/*
  # Income tracking table

  1. New Tables
    - `income`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `amount` (numeric, positive values only)
      - `category` (text)
      - `description` (text)
      - `date` (date)
      - `notes` (text, optional)
      - `is_recurring` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `income` table
    - Add policies for authenticated users to manage their own income records

  3. Performance
    - Add indexes on user_id, date, and category for efficient queries
*/

-- Create income table if it doesn't exist
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  notes text,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS income_user_id_idx ON income(user_id);
CREATE INDEX IF NOT EXISTS income_date_idx ON income(date);
CREATE INDEX IF NOT EXISTS income_category_idx ON income(category);

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Users can view their own income" ON income;
  DROP POLICY IF EXISTS "Users can insert their own income" ON income;
  DROP POLICY IF EXISTS "Users can update their own income" ON income;
  DROP POLICY IF EXISTS "Users can delete their own income" ON income;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their own income"
    ON income
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own income"
    ON income
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own income"
    ON income
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own income"
    ON income
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
END $$;