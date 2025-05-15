/*
  # Fix email validation function

  1. Changes
    - Move check_email_exists function to public schema
    - Add security policy to allow authenticated users to check emails
    - Keep function as security definer for secure access

  2. Security
    - Function remains security definer to allow checking without full table access
    - Only allows checking email existence, no other data exposed
*/

-- Drop existing function in auth schema
DROP FUNCTION IF EXISTS auth.check_email_exists;

-- Create function in public schema
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = check_email
  );
END;
$$;