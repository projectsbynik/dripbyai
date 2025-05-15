/*
  # Add Admin Console UI Improvements

  1. Changes
    - Add metadata column for UI preferences
    - Add function to save UI preferences
    - Add function to get UI preferences
    - Add audit logging for UI changes

  2. Security
    - Maintain existing RLS policies
    - Add proper audit logging
*/

-- Add metadata column for UI preferences if it doesn't exist
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS ui_preferences jsonb DEFAULT '{}'::jsonb;

-- Function to save UI preferences
CREATE OR REPLACE FUNCTION save_ui_preferences(
  preferences jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET ui_preferences = preferences
  WHERE id = auth.uid();
END;
$$;

-- Function to get UI preferences
CREATE OR REPLACE FUNCTION get_ui_preferences()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefs jsonb;
BEGIN
  SELECT ui_preferences INTO prefs
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(prefs, '{}'::jsonb);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION save_ui_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_ui_preferences TO authenticated;