/*
  # Fix RLS policies for generated_videos table

  1. Security Updates
    - Add missing INSERT policy for authenticated users
    - Add missing UPDATE policy for authenticated users  
    - Ensure users can manage their own video records

  2. Policy Details
    - INSERT: Allow authenticated users to create videos with their own user_id
    - UPDATE: Allow authenticated users to update their own videos
    - SELECT: Allow authenticated users to view their own videos (already exists)
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Users can insert their own generated videos"
  ON generated_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for authenticated users  
CREATE POLICY "Users can update their own generated videos"
  ON generated_videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the service role can also update video status (for webhooks)
CREATE POLICY "Service role can update video status"
  ON generated_videos
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);