/*
  # Create generated_videos table for Tavus AI video tracking

  1. New Tables
    - `generated_videos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `video_id` (text, unique, Tavus video ID)
      - `video_type` (text, type of video: onboarding, celebration, report)
      - `video_url` (text, nullable, final video URL from Tavus)
      - `thumbnail_url` (text, nullable, thumbnail URL)
      - `status` (text, video generation status)
      - `script` (text, nullable, original script used)
      - `duration` (integer, nullable, video duration in seconds)
      - `error_message` (text, nullable, error details if failed)
      - `metadata` (jsonb, nullable, additional video metadata)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `generated_videos` table
    - Add policies for authenticated users to view their own videos
    - Add policy for service role to update video status (for webhook)

  3. Indexes
    - Add indexes for efficient querying by user_id, video_id, and status
*/

CREATE TABLE IF NOT EXISTS generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text UNIQUE NOT NULL,
  video_type text NOT NULL CHECK (video_type IN ('onboarding', 'celebration', 'report', 'custom')),
  video_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  script text,
  duration integer,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS generated_videos_user_id_idx ON generated_videos(user_id);
CREATE INDEX IF NOT EXISTS generated_videos_video_id_idx ON generated_videos(video_id);
CREATE INDEX IF NOT EXISTS generated_videos_status_idx ON generated_videos(status);
CREATE INDEX IF NOT EXISTS generated_videos_created_at_idx ON generated_videos(created_at);

-- Create RLS policies
CREATE POLICY "Users can view their own generated videos"
  ON generated_videos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated videos"
  ON generated_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update video status"
  ON generated_videos
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own videos"
  ON generated_videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();