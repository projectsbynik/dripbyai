/*
  # Fix storage policy for profile images

  1. Changes
    - Remove folder structure requirement from upload policy
    - Allow any authenticated user to upload to profile-images bucket
    - Keep read access for all authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all profile images" ON storage.objects;

-- Create new simplified upload policy
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Create policy to allow authenticated users to read any profile image
CREATE POLICY "Authenticated users can view all profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-images');