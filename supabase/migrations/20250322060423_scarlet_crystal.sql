/*
  # Fix Admin Permissions and Product Management

  1. Changes
    - Add proper RLS policies for product management
    - Fix admin check function
    - Add admin role checks
    - Update product table permissions

  2. Security
    - Only admins can manage products
    - Maintain read access for authenticated users
    - Fix permission denied errors
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Anyone can read products" ON products;

-- Create new admin check function with proper permissions
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

-- Create new policies for product management
CREATE POLICY "Admins can manage all products"
ON products
FOR ALL
TO authenticated
USING (
  (SELECT is_admin())
)
WITH CHECK (
  (SELECT is_admin())
);

CREATE POLICY "Anyone can read products"
ON products
FOR SELECT
TO authenticated
USING (true);

-- Ensure admin user exists (replace with your admin email)
UPDATE auth.users
SET is_admin = true
WHERE email = 'admin@admin.com';