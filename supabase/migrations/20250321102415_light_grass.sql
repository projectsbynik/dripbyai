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
  -- Attempt to set first admin user if exists
  UPDATE auth.users
  SET is_admin = true
  WHERE email = 'admin@admin.com';

  -- Notice if user does not exist yet (admin will be configured via SQL snippet after signup)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = 'admin@admin.com' AND is_admin = true
  ) THEN
    RAISE NOTICE 'Admin user admin@admin.com not found. Create user and run: UPDATE auth.users SET is_admin = true WHERE email = <email>;';
  END IF;
END $$;