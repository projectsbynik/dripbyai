/*
  # Update product URL schema

  1. Changes
    - Remove affiliate_link column since it's the same as source_url
    - Update existing products to use source_url as the buy link
    - Add NOT NULL constraint to source_url

  2. Security
    - Maintains existing RLS policies
*/

-- First ensure source_url is not null for existing products
UPDATE products 
SET source_url = affiliate_link 
WHERE source_url IS NULL AND affiliate_link IS NOT NULL;

-- Add NOT NULL constraint to source_url
ALTER TABLE products 
ALTER COLUMN source_url SET NOT NULL;

-- Drop affiliate_link column
ALTER TABLE products 
DROP COLUMN IF EXISTS affiliate_link;