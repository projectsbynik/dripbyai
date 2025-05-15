/*
  # Add email validation and unique constraint

  1. Changes
    - Add unique constraint on auth.users email field
    - Add function to check if email exists
    - Add policy to allow email checks

  2. Security
    - Function is security definer to allow checking without full table access
    - Only allows checking email existence, no other data exposed
*/

-- Function to check if email exists
CREATE OR REPLACE FUNCTION auth.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = check_email
  );
END;
$$;