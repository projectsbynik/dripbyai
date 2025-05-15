/*
  # Add keywords to products table

  1. Changes
    - Add keywords column to products table for better search functionality
    - Update existing products with sample keywords
    - Add text search capabilities

  2. Notes
    - Keywords are stored as text array for flexible matching
    - Each product can have multiple keywords
*/

-- Add keywords column to products table
ALTER TABLE products
ADD COLUMN keywords text[] DEFAULT '{}';

-- Update existing products with sample keywords
UPDATE products
SET keywords = ARRAY['formal', 'office', 'business', 'professional', 'shirt', 'men']
WHERE name = 'Classic White Shirt';

UPDATE products
SET keywords = ARRAY['party', 'evening', 'formal', 'dress', 'cocktail', 'women']
WHERE name = 'Evening Cocktail Dress';

UPDATE products
SET keywords = ARRAY['makeup', 'cosmetics', 'lipstick', 'beauty', 'red', 'matte']
WHERE name = 'Matte Lipstick';