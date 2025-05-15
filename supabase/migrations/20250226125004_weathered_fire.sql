/*
  # Fix product table array types and add sample data

  1. Changes
    - Drop existing array columns
    - Recreate array columns with proper types
    - Add sample product data
  
  2. Security
    - Maintains existing RLS policies
*/

-- First drop the existing array columns
ALTER TABLE products 
DROP COLUMN IF EXISTS skin_tones,
DROP COLUMN IF EXISTS undertones,
DROP COLUMN IF EXISTS body_shapes_male,
DROP COLUMN IF EXISTS body_shapes_female;

-- Add the columns back with proper array types
ALTER TABLE products
ADD COLUMN skin_tones text[] DEFAULT '{}',
ADD COLUMN undertones text[] DEFAULT '{}',
ADD COLUMN body_shapes_male text[] DEFAULT '{}',
ADD COLUMN body_shapes_female text[] DEFAULT '{}';

-- Insert sample product data
INSERT INTO products (
  name,
  description,
  price,
  image_url,
  affiliate_link,
  occasion,
  skin_tones,
  undertones,
  body_shapes_male,
  body_shapes_female
) VALUES
(
  'Classic White Shirt',
  'A timeless white cotton shirt perfect for any occasion',
  49.99,
  'https://example.com/white-shirt.jpg',
  'https://example.com/buy/white-shirt',
  'office',
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['warm', 'cool', 'neutral'],
  ARRAY['rectangle', 'inverted_triangle', 'trapezoid'],
  NULL
),
(
  'Evening Cocktail Dress',
  'Elegant black cocktail dress with a flattering cut',
  129.99,
  'https://example.com/cocktail-dress.jpg',
  'https://example.com/buy/cocktail-dress',
  'party',
  ARRAY['fair', 'wheatish', 'brown'],
  ARRAY['cool', 'neutral'],
  NULL,
  ARRAY['hourglass', 'rectangle', 'pear']
),
(
  'Matte Lipstick',
  'Long-lasting matte lipstick in a universal red shade',
  24.99,
  'https://example.com/lipstick.jpg',
  'https://example.com/buy/lipstick',
  'party',
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['warm', 'cool'],
  NULL,
  ARRAY['hourglass', 'pear', 'apple', 'rectangle', 'spoon', 'diamond', 'oval']
);