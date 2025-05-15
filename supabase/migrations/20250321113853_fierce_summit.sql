/*
  # Fix product creation issues

  1. Changes
    - Add proper constraints for required fields
    - Add default values for arrays
    - Add validation for price and popularity
    - Update RLS policies for product management

  2. Security
    - Maintain existing admin access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Anyone can read products" ON products;

-- Update products table constraints
ALTER TABLE products
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN price SET NOT NULL,
ALTER COLUMN image_url SET NOT NULL,
ALTER COLUMN occasion SET NOT NULL,
ALTER COLUMN keywords SET DEFAULT '{}',
ALTER COLUMN skin_tones SET DEFAULT '{}',
ALTER COLUMN undertones SET DEFAULT '{}',
ALTER COLUMN body_shapes_male SET DEFAULT '{}',
ALTER COLUMN body_shapes_female SET DEFAULT '{}',
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Add check constraints
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_price_check,
ADD CONSTRAINT products_price_check CHECK (price >= 0),
DROP CONSTRAINT IF EXISTS products_popularity_check,
ADD CONSTRAINT products_popularity_check CHECK (popularity >= 0);

-- Create new policies
CREATE POLICY "Admins can manage all products"
ON products
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

CREATE POLICY "Anyone can read products"
ON products
FOR SELECT
TO authenticated
USING (true);