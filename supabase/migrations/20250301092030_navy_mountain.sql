/*
  # Add AI Analysis Support

  1. Changes
    - Add AI analysis fields to profiles table if they don't exist
    - Add analysis status enum type if it doesn't exist
    - Add analysis result fields
    - Add analysis timestamp fields

  2. Security
    - Maintain existing RLS policies
*/

-- Create analysis status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE analysis_status_type AS ENUM (
    'pending',
    'analyzing',
    'completed',
    'error'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add AI analysis fields to profiles table if they don't exist
DO $$ BEGIN
  -- Check and add analysis_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'analysis_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN analysis_started_at timestamptz;
  END IF;

  -- Check and add analysis_completed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'analysis_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN analysis_completed_at timestamptz;
  END IF;

  -- Check and add analysis_error
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'analysis_error'
  ) THEN
    ALTER TABLE profiles ADD COLUMN analysis_error text;
  END IF;

  -- Check and add ai_confidence_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ai_confidence_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_confidence_score float CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1);
  END IF;
END $$;

-- Create function to update analysis timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_analysis_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.analysis_status = 'analyzing' AND OLD.analysis_status != 'analyzing' THEN
    NEW.analysis_started_at = now();
  ELSIF NEW.analysis_status = 'completed' AND OLD.analysis_status != 'completed' THEN
    NEW.analysis_completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_analysis_timestamps ON profiles;
CREATE TRIGGER update_analysis_timestamps
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_timestamps();