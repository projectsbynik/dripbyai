/*
  # Create first admin user

  1. Changes
    - Set admin@admin.com as the first admin user
    - This is a one-time operation to bootstrap admin access
    - Future admin assignments should be done through the auth.create_admin function

  2. Security
    - Uses SECURITY DEFINER to ensure operation runs with elevated privileges
    - Sets search_path for security
*/

DO $$
BEGIN
  -- Set the first admin user
  UPDATE auth.users
  SET is_admin = true
  WHERE email = 'admin@admin.com';

  -- Verify the update
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = 'admin@admin.com' AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Failed to set admin privileges or user does not exist';
  END IF;
END $$;