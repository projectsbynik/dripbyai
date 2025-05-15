/*
  # Add Wishlist Table

  1. New Tables
    - `wishlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `profile_id` (text, references profiles)
      - `product_id` (uuid, references products)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `wishlists` table
    - Add policies for authenticated users to manage their wishlists
*/

CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  profile_id text REFERENCES profiles(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique combination of user, profile, and product
  UNIQUE(user_id, profile_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their wishlists"
  ON wishlists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);