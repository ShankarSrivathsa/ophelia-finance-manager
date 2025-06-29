/*
  # Fix RLS policies for generated_videos table

  1. Security Updates
    - Drop existing conflicting policies if they exist
    - Recreate policies with proper permissions for authenticated users
    - Ensure service role can update video status for webhooks

  2. Changes
    - Allow authenticated users to insert their own videos
    - Allow authenticated users to update their own videos
    - Allow service role to update any video (for webhook updates)
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  -- Drop INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_videos' 
    AND policyname = 'Users can insert their own generated videos'
  ) THEN
    DROP POLICY "Users can insert their own generated videos" ON generated_videos;
  END IF;

  -- Drop UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_videos' 
    AND policyname = 'Users can update their own generated videos'
  ) THEN
    DROP POLICY "Users can update their own generated videos" ON generated_videos;
  END IF;

  -- Drop service role UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_videos' 
    AND policyname = 'Service role can update video status'
  ) THEN
    DROP POLICY "Service role can update video status" ON generated_videos;
  END IF;

  -- Drop authenticated users UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_videos' 
    AND policyname = 'Authenticated users can update their own videos'
  ) THEN
    DROP POLICY "Authenticated users can update their own videos" ON generated_videos;
  END IF;
END $$;

-- Create INSERT policy for authenticated users
CREATE POLICY "Users can insert their own generated videos"
  ON generated_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for authenticated users  
CREATE POLICY "Users can update their own generated videos"
  ON generated_videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for service role (for webhooks)
CREATE POLICY "Service role can update video status"
  ON generated_videos
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);