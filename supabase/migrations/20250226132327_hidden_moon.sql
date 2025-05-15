/*
  # Create storage bucket for profile images

  1. New Storage Bucket
    - Creates a new public bucket called 'profile-images'
    - Enables RLS
    - Sets up policies for authenticated users to:
      - Upload their own profile images
      - Read any profile image
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow authenticated users to read any profile image
CREATE POLICY "Authenticated users can view all profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-images');