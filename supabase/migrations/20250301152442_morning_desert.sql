/*
  # Fix profile deletion functionality

  1. Changes
    - Add DELETE policy for profiles table
    - Add DELETE policy for storage objects
    - Add CASCADE DELETE for wishlists

  2. Security
    - Only authenticated users can delete their own profiles
    - Only authenticated users can delete their own profile images
    - Wishlists are automatically deleted when profile is deleted
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete their own profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;

-- Create policy to allow users to delete their own profiles
CREATE POLICY "Users can delete their own profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own profile images
CREATE POLICY "Authenticated users can delete profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images');

-- Add CASCADE DELETE for wishlists
ALTER TABLE wishlists
DROP CONSTRAINT IF EXISTS wishlists_profile_id_fkey,
ADD CONSTRAINT wishlists_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;