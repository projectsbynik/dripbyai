/*
  # Fix admin function access

  1. Changes
    - Move is_admin function to public schema
    - Add proper security settings
    - Ensure function is accessible to authenticated users

  2. Security
    - Uses SECURITY DEFINER to run with elevated privileges
    - Sets search_path for security
    - Maintains RLS policies
*/

-- Drop existing function if it exists in auth schema
DROP FUNCTION IF EXISTS auth.is_admin;

-- Create function in public schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;