/*
  # Fix product table schema

  1. Changes
    - Drop existing ENUMs and columns
    - Create new ENUMs with clean values
    - Add array columns for skin tones, undertones, and body shapes
    
  2. Security
    - Maintains existing RLS policies
*/

DO $$ BEGIN
  -- Drop existing columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'skin_tones') THEN
    ALTER TABLE products DROP COLUMN skin_tones;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'undertones') THEN
    ALTER TABLE products DROP COLUMN undertones;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'body_shapes_male') THEN
    ALTER TABLE products DROP COLUMN body_shapes_male;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'body_shapes_female') THEN
    ALTER TABLE products DROP COLUMN body_shapes_female;
  END IF;
END $$;

DO $$ BEGIN
  -- Drop existing types if they exist
  DROP TYPE IF EXISTS skin_tones;
  DROP TYPE IF EXISTS undertones;
  DROP TYPE IF EXISTS body_shapes_male;
  DROP TYPE IF EXISTS body_shapes_female;
  
  -- Create new types
  CREATE TYPE skin_tone_type AS ENUM (
    'fair',
    'wheatish',
    'brown',
    'intense_dark'
  );
  
  CREATE TYPE undertone_type AS ENUM (
    'warm',
    'cool',
    'neutral'
  );
  
  CREATE TYPE body_shape_male_type AS ENUM (
    'rectangle',
    'triangle',
    'inverted_triangle',
    'oval',
    'trapezoid'
  );
  
  CREATE TYPE body_shape_female_type AS ENUM (
    'hourglass',
    'pear',
    'apple',
    'rectangle',
    'spoon',
    'diamond',
    'oval'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns with array types
ALTER TABLE products
ADD COLUMN skin_tones skin_tone_type[] DEFAULT '{}',
ADD COLUMN undertones undertone_type[] DEFAULT '{}',
ADD COLUMN body_shapes_male body_shape_male_type[] DEFAULT '{}',
ADD COLUMN body_shapes_female body_shape_female_type[] DEFAULT '{}';