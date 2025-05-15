/*
  # Fix admin permission checks

  1. Changes
    - Drop existing admin check functions
    - Create new admin check function with proper permissions
    - Update RLS policies for admin access
    - Add storage policies for admin access

  2. Security
    - Maintain existing security model
    - Add proper RLS for admin operations
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new admin check function with proper permissions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the function to access auth.users
  SET LOCAL ROLE postgres;
  
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Create policy for admins to manage storage
CREATE POLICY "Admins can manage all storage"
ON storage.objects
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  )
);