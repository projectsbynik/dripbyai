/*
  # Fix body shape constraint

  1. Changes
    - Update the valid_body_shape constraint to allow both body shape fields to be null during AI analysis
    - This allows profiles to be created with pending AI analysis without violating the constraint
*/

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_body_shape;

-- Add the updated constraint that allows both fields to be null during analysis
ALTER TABLE profiles ADD CONSTRAINT valid_body_shape CHECK (
  (gender = 'male' AND body_shape_female IS NULL AND (body_shape_male IS NOT NULL OR analysis_status = 'analyzing')) OR
  (gender = 'female' AND body_shape_male IS NULL AND (body_shape_female IS NOT NULL OR analysis_status = 'analyzing'))
);