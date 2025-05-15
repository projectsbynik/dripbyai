/*
  # Create profiles table and related enums

  1. New Types
    - gender_type ENUM
    - skin_tone_type ENUM
    - undertone_type ENUM
    - body_shape_male_type ENUM
    - body_shape_female_type ENUM
    - country_type ENUM

  2. New Tables
    - profiles
      - id (text, 12-char alphanumeric)
      - user_id (uuid, references auth.users)
      - name (text)
      - age (int)
      - gender (gender_type)
      - country (country_type)
      - skin_tone (skin_tone_type)
      - undertone (undertone_type)
      - body_shape_male (body_shape_male_type)
      - body_shape_female (body_shape_female_type)
      - face_image_url (text)
      - body_image_url (text)
      - analysis_status (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  3. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create ENUMs
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE skin_tone_type AS ENUM ('fair', 'wheatish', 'brown', 'intense_dark');
CREATE TYPE undertone_type AS ENUM ('warm', 'cool', 'neutral');
CREATE TYPE body_shape_male_type AS ENUM ('rectangle', 'triangle', 'inverted_triangle', 'oval', 'trapezoid');
CREATE TYPE body_shape_female_type AS ENUM ('hourglass', 'pear', 'apple', 'rectangle', 'spoon', 'diamond', 'oval');
CREATE TYPE country_type AS ENUM ('usa', 'india', 'uk');

-- Create profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY CHECK (length(id) = 12),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0),
  gender gender_type NOT NULL,
  country country_type NOT NULL,
  skin_tone skin_tone_type,
  undertone undertone_type,
  body_shape_male body_shape_male_type,
  body_shape_female body_shape_female_type,
  face_image_url TEXT,
  body_image_url TEXT,
  analysis_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure only one body shape type is set based on gender
  CONSTRAINT valid_body_shape CHECK (
    (gender = 'male' AND body_shape_male IS NOT NULL AND body_shape_female IS NULL) OR
    (gender = 'female' AND body_shape_female IS NOT NULL AND body_shape_male IS NULL)
  )
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();