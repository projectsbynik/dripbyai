-- ==============================================================================
-- DripbyAI - Sample Database Seed Data
-- ==============================================================================
-- Run this script in the Supabase SQL Editor after running schema.sql
-- to populate initial search synonyms and sample fashion items.

-- 1. Search Synonyms
INSERT INTO public.search_synonyms (word, synonyms) VALUES
  ('shirt', ARRAY['tee', 't-shirt', 'top', 'blouse', 'polo', 'button-down']),
  ('pants', ARRAY['trousers', 'slacks', 'bottoms', 'jeans', 'chinos', 'cargo']),
  ('dress', ARRAY['gown', 'frock', 'maxi', 'midi', 'sundress']),
  ('suit', ARRAY['blazer', 'tuxedo', 'formal suit', 'co-ord']),
  ('shoes', ARRAY['footwear', 'sneakers', 'boots', 'loafers', 'heels']),
  ('jacket', ARRAY['coat', 'blazer', 'outerwear', 'bomber', 'overshirt']),
  ('kurti', ARRAY['kurta', 'ethnic wear', 'tunic', 'anarkali']),
  ('hoodie', ARRAY['sweatshirt', 'pullover', 'jumper'])
ON CONFLICT (word) DO UPDATE 
SET synonyms = EXCLUDED.synonyms;

-- 2. Sample Fashion Products
INSERT INTO public.products (
  name, description, price, image_url, source_url, affiliate_link,
  occasion, popularity, is_active, gender, keywords,
  skin_tones, undertones, body_shapes_male, body_shapes_female
) VALUES
-- Product 1: Men's Linen Casual Shirt
(
  'Classic Sage Green Linen Casual Shirt',
  'Breathable pure linen shirt with a modern relaxed cut. Ideal for warm weather, brunch, and casual Fridays.',
  2499,
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/linen-shirt',
  'https://example.com/affiliate/linen-shirt',
  ARRAY['casual', 'office'],
  120,
  true,
  'male',
  ARRAY['shirt', 'linen', 'green', 'casual', 'breathable', 'summer', 'button-down'],
  ARRAY['fair', 'wheatish', 'brown'],
  ARRAY['warm', 'neutral'],
  ARRAY['rectangle', 'trapezoid', 'oval'],
  ARRAY[]::text[]
),
-- Product 2: Men's Navy Slim Fit Blazer
(
  'Tailored Navy Italian Wool Blazer',
  'Sharply tailored two-button blazer crafted from lightweight tropical wool. Features notch lapels and double vents.',
  6999,
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/navy-blazer',
  'https://example.com/affiliate/navy-blazer',
  ARRAY['office', 'party'],
  350,
  true,
  'male',
  ARRAY['blazer', 'suit', 'navy', 'formal', 'office', 'jacket', 'wool'],
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['cool', 'neutral'],
  ARRAY['inverted_triangle', 'trapezoid', 'rectangle'],
  ARRAY[]::text[]
),
-- Product 3: Men's Relaxed Fit Trousers
(
  'Pleated Khaki Chino Trousers',
  'Timeless mid-rise pleated chinos in durable organic cotton twill. Effortlessly pairs with polos or crisp formal shirts.',
  1999,
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/khaki-trousers',
  'https://example.com/affiliate/khaki-trousers',
  ARRAY['office', 'casual'],
  95,
  true,
  'male',
  ARRAY['pants', 'trousers', 'chinos', 'khaki', 'cotton', 'casual', 'slacks'],
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['warm', 'neutral'],
  ARRAY['rectangle', 'triangle', 'oval', 'trapezoid'],
  ARRAY[]::text[]
),
-- Product 4: Men's Silk Blend Embroidered Kurta
(
  'Burgundy Embroidered Silk Kurta Set',
  'Intricately embroidered mandarin-collar festive kurta in rich raw silk. Perfect for weddings and festival celebrations.',
  5499,
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/burgundy-kurta',
  'https://example.com/affiliate/burgundy-kurta',
  ARRAY['wedding', 'party'],
  420,
  true,
  'male',
  ARRAY['kurta', 'ethnic', 'silk', 'burgundy', 'wedding', 'festival', 'traditional'],
  ARRAY['wheatish', 'brown', 'intense_dark'],
  ARRAY['warm', 'cool'],
  ARRAY['trapezoid', 'rectangle', 'inverted_triangle'],
  ARRAY[]::text[]
),
-- Product 5: Women's Emerald Satin Wrap Midi Dress
(
  'Emerald Green Satin Wrap Midi Dress',
  'Flattering V-neck wrap silhouette with a self-tie waist that accentuates the waistline. Elegant drape for cocktail evenings.',
  3899,
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/satin-wrap-dress',
  'https://example.com/affiliate/satin-wrap-dress',
  ARRAY['party', 'wedding'],
  580,
  true,
  'female',
  ARRAY['dress', 'midi', 'wrap', 'satin', 'emerald', 'green', 'party', 'cocktail'],
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['cool', 'warm', 'neutral'],
  ARRAY[]::text[],
  ARRAY['hourglass', 'pear', 'apple', 'rectangle', 'spoon']
),
-- Product 6: Women's Tailored Ivory Pantsuit
(
  'Modern Ivory Structured Double-Breasted Blazer & Trousers',
  'Power dressing at its finest. Premium blended crepe blazer with peak lapels paired with wide-leg high-waisted pants.',
  7999,
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/ivory-pantsuit',
  'https://example.com/affiliate/ivory-pantsuit',
  ARRAY['office', 'party'],
  410,
  true,
  'female',
  ARRAY['suit', 'blazer', 'pantsuit', 'white', 'ivory', 'office', 'formal', 'powersuit'],
  ARRAY['wheatish', 'brown', 'intense_dark', 'fair'],
  ARRAY['warm', 'neutral'],
  ARRAY[]::text[],
  ARRAY['rectangle', 'inverted_triangle', 'hourglass', 'diamond']
),
-- Product 7: Women's Floral Chiffon A-Line Sundress
(
  'Pastel Lilac Floral Tiered Maxi Dress',
  'Flowy lightweight chiffon dress adorned with watercolor floral prints. Featuring a square neckline and puffed short sleeves.',
  2799,
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/floral-maxi',
  'https://example.com/affiliate/floral-maxi',
  ARRAY['casual', 'party'],
  230,
  true,
  'female',
  ARRAY['dress', 'floral', 'maxi', 'chiffon', 'summer', 'casual', 'lilac'],
  ARRAY['fair', 'wheatish'],
  ARRAY['cool', 'neutral'],
  ARRAY[]::text[],
  ARRAY['pear', 'hourglass', 'rectangle', 'oval']
),
-- Product 8: Women's Organza Embroidered Anarkali
(
  'Dusty Rose Handcrafted Organza Anarkali Set',
  'Voluminous floor-length flare decorated with zari and sequin motifs. Includes embroidered dupatta and matching churidar.',
  8499,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/rose-anarkali',
  'https://example.com/affiliate/rose-anarkali',
  ARRAY['wedding'],
  690,
  true,
  'female',
  ARRAY['anarkali', 'ethnic', 'kurti', 'wedding', 'festive', 'traditional', 'pink'],
  ARRAY['fair', 'wheatish', 'brown'],
  ARRAY['warm', 'cool', 'neutral'],
  ARRAY[]::text[],
  ARRAY['apple', 'pear', 'hourglass', 'spoon', 'diamond', 'oval']
),
-- Product 9: Men's Structured Denim Overshirt
(
  'Vintage Washed Denim Trucker Jacket',
  'Classic 12oz denim jacket with contrast stitching and metal shank buttons. Layer over tees or hoodies.',
  3299,
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/denim-jacket',
  'https://example.com/affiliate/denim-jacket',
  ARRAY['casual'],
  180,
  true,
  'male',
  ARRAY['jacket', 'denim', 'blue', 'trucker', 'casual', 'layering', 'outerwear'],
  ARRAY['fair', 'wheatish', 'brown', 'intense_dark'],
  ARRAY['cool', 'neutral', 'warm'],
  ARRAY['rectangle', 'trapezoid', 'triangle'],
  ARRAY[]::text[]
),
-- Product 10: Women's Knitted Mock Neck Top
(
  'Terracotta Ribbed Knit Fitted Top',
  'Cozy stretch-ribbed cotton blend top with elegant mock neck collar. Essential capsule wardrobe layering piece.',
  1499,
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  'https://example.com/products/ribbed-top',
  'https://example.com/affiliate/ribbed-top',
  ARRAY['casual', 'office'],
  145,
  true,
  'female',
  ARRAY['top', 'shirt', 'knit', 'terracotta', 'casual', 'autumn', 'ribbed'],
  ARRAY['wheatish', 'brown', 'intense_dark'],
  ARRAY['warm'],
  ARRAY[]::text[],
  ARRAY['hourglass', 'rectangle', 'inverted_triangle']
);

-- ==============================================================================
-- 3. Bootstrap First Admin Instructions
-- ==============================================================================
-- To promote any registered user to an administrator:
-- 1. Sign up on your frontend (http://localhost:5173/auth) with your desired email.
-- 2. Run the snippet below with your registered email address:
--
-- UPDATE auth.users
-- SET is_admin = true
-- WHERE email = 'your-email@example.com';
-- ==============================================================================
