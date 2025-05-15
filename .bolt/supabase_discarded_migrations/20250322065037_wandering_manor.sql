/*
  # Add affiliate link field to products table

  1. Changes
    - Add affiliate_link column with NOT NULL constraint
    - Set default affiliate link for existing products
    - Update product form validation

  2. Security
    - Maintains existing RLS policies
*/

-- Add affiliate_link column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'affiliate_link'
  ) THEN
    ALTER TABLE products
    ADD COLUMN affiliate_link text NOT NULL DEFAULT '';
  END IF;
END $$;