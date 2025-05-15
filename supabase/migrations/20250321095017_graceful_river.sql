/*
  # Add Admin Support and Product Management Updates

  1. Changes
    - Add is_admin column to auth.users
    - Add gender field to products table
    - Update products table with new fields
    - Add metadata support for products

  2. Security
    - Only allow admin access to certain operations
    - Maintain existing RLS policies
*/

-- Add is_admin column to auth.users if it doesn't exist
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add gender type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'unisex');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update products table with new fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS gender gender_type,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS source_url text;

-- Create admin access policy for products
CREATE POLICY "Admins can manage all products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND is_admin = true
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;