/*
  # Change occasion field from enum to array type

  1. Changes
    - Add new occasion array column
    - Copy existing data to new column
    - Drop old occasion column
    - Rename new column to occasion
    - Drop occasion_type enum

  2. Security
    - Maintains existing RLS policies
*/

-- First, add a new column for occasion array
ALTER TABLE products
ADD COLUMN occasion_array text[] DEFAULT '{}';

-- Copy existing occasion values to the new array column
UPDATE products
SET occasion_array = ARRAY[occasion::text];

-- Drop the old occasion column
ALTER TABLE products
DROP COLUMN occasion;

-- Rename the new column to occasion
ALTER TABLE products
RENAME COLUMN occasion_array TO occasion;

-- Drop the occasion_type enum
DROP TYPE IF EXISTS occasion_type;