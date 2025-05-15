/*
  # Create products table and related schemas

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `affiliate_link` (text)
      - `occasion` (occasion_type)
      - `popularity` (integer)
      - `skin_tones` (skin_tone_type[])
      - `undertones` (undertone_type[])
      - `body_shapes_male` (body_shape_male_type[])
      - `body_shapes_female` (body_shape_female_type[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Types
    - `occasion_type` ENUM for different occasions
*/

-- Create occasion type ENUM
CREATE TYPE occasion_type AS ENUM ('office', 'party', 'casual', 'wedding');
CREATE TYPE skin_tones AS ENUM ('Fair', 'Wheatish', ': Brown', 'Intense Dark');
CREATE TYPE undertones AS ENUM ('Warm', 'Cool', 'Neutral');
CREATE TYPE body_shapes_male AS ENUM ('Rectangle: Equal shoulders, waist, and hips.', 'Triangle: Shoulders narrower than waist/hips.', 'Inverted Triangle: Shoulders wider than waist/hips.', 'Oval: Waist wider than shoulders/hips.', 'Trapezoid: Shoulders > Waist > Hips (balanced proportion).');
CREATE TYPE body_shapes_female AS ENUM ('Hourglass: Bust and hips equal, with a smaller waist.', 'Pear/Triangle: Hips wider than bust/shoulders.', 'Apple/Inverted Triangle: Bust/shoulders wider than hips.', 'Rectangle: Bust, waist, and hips equal.', 'Spoon: Defined hip curve, wider hips.', 'Diamond: Waist wider than bust/hips.', 'Oval: Rounded shape with a larger bust and stomach.');

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  affiliate_link text NOT NULL,
  occasion occasion_type NOT NULL,
  popularity integer DEFAULT 0 CHECK (popularity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for reading products
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();