/*
  # Add Admin User Management

  1. Changes
    - Add function to create admin users
    - Add function to remove admin privileges
    - Add function to list admin users
    - Add security checks and validations

  2. Security
    - Only existing admins can create new admins
    - Functions are security definer to ensure proper access control
*/

-- Function to create an admin user
CREATE OR REPLACE FUNCTION auth.create_admin(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only existing admins can create new admins';
  END IF;

  -- Get the user ID for the target email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE auth.users.email = create_admin.email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email;
  END IF;

  -- Check if user is already an admin
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;

  -- Grant admin privileges
  UPDATE auth.users
  SET is_admin = true
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Function to remove admin privileges
CREATE OR REPLACE FUNCTION auth.remove_admin(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only existing admins can remove admin privileges';
  END IF;

  -- Get the user ID for the target email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE auth.users.email = remove_admin.email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email;
  END IF;

  -- Check if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  -- Remove admin privileges
  UPDATE auth.users
  SET is_admin = false
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION auth.list_admins()
RETURNS TABLE (
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can view the admin list';
  END IF;

  RETURN QUERY
  SELECT users.email, users.created_at
  FROM auth.users
  WHERE is_admin = true
  ORDER BY users.created_at;
END;
$$;