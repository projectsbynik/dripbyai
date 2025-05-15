/*
  # Fix create_user function and pgcrypto extension

  1. Changes
    - Enable pgcrypto extension which provides cryptographic functions
    - Fix the create_user function that was failing with gen_salt error
    - Properly handle password hashing with pgcrypto
    - Update function to safely create users

  2. Security
    - Maintains existing security model
    - Properly hashes passwords with bcrypt
    - Only admins can create users
*/

-- Ensure pgcrypto extension is enabled (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_user;

-- Create a fixed version of the function
CREATE OR REPLACE FUNCTION public.create_user(
  email text,
  password text,
  is_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Hash the password with pgcrypto
  hashed_password := crypt(password, gen_salt('bf', 10));

  -- Create user in auth.users
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    email,
    hashed_password,
    now(), -- Auto-confirm email
    is_admin,
    now(),
    now()
  )
  RETURNING id INTO new_user_id;

  -- Log the action
  PERFORM log_admin_action(
    'create',
    'user',
    new_user_id::text,
    NULL,
    jsonb_build_object(
      'email', email,
      'is_admin', is_admin
    )
  );

  RETURN new_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user TO authenticated;