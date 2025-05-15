/*
  # Fix admin function permissions

  1. Changes
    - Drop existing is_admin function
    - Create new version without SET LOCAL ROLE
    - Add proper security context
    - Maintain existing RLS policies

  2. Security
    - Function runs with SECURITY DEFINER
    - Proper schema search path set
    - Direct auth.users table access
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new version of is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;