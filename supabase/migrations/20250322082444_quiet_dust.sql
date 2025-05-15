/*
  # Add User Management Features

  1. Changes
    - Add function to create new users with roles
    - Add function to get paginated user list
    - Add function to update user roles
    - Add audit logging for user management

  2. Security
    - All functions are security definer
    - Only admins can access these functions
    - Password hashing handled by Supabase Auth
*/

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_user(
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
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

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
    crypt(password, gen_salt('bf')),
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

-- Function to get paginated user list with search and filters
CREATE OR REPLACE FUNCTION get_users(
  search_term text DEFAULT NULL,
  role text DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 10,
  sort_by text DEFAULT 'email',
  sort_order text DEFAULT 'asc'
)
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_login timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can view user list';
  END IF;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT 
      u.id,
      u.email,
      u.is_admin,
      u.created_at,
      u.last_login,
      COUNT(*) OVER() as total_count
    FROM auth.users u
    WHERE 
      (search_term IS NULL OR u.email ILIKE '%' || search_term || '%') AND
      (role IS NULL OR 
       (role = 'admin' AND u.is_admin = true) OR 
       (role = 'regular' AND u.is_admin = false))
    ORDER BY
      CASE 
        WHEN sort_by = 'email' AND sort_order = 'asc' THEN u.email
      END ASC,
      CASE 
        WHEN sort_by = 'email' AND sort_order = 'desc' THEN u.email
      END DESC,
      CASE 
        WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN u.created_at::text
      END ASC,
      CASE 
        WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN u.created_at::text
      END DESC,
      CASE 
        WHEN sort_by = 'last_login' AND sort_order = 'asc' THEN u.last_login::text
      END ASC,
      CASE 
        WHEN sort_by = 'last_login' AND sort_order = 'desc' THEN u.last_login::text
      END DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size
  )
  SELECT * FROM filtered_users;
END;
$$;

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  user_id uuid,
  new_is_admin boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_values jsonb;
  new_values jsonb;
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Get old values
  SELECT jsonb_build_object(
    'email', email,
    'is_admin', is_admin
  ) INTO old_values
  FROM auth.users
  WHERE id = user_id;

  -- Update user role
  UPDATE auth.users
  SET 
    is_admin = new_is_admin,
    updated_at = now()
  WHERE id = user_id;

  -- Get new values
  SELECT jsonb_build_object(
    'email', email,
    'is_admin', is_admin
  ) INTO new_values
  FROM auth.users
  WHERE id = user_id;

  -- Log the change
  PERFORM log_admin_action(
    'update_role',
    'user',
    user_id::text,
    old_values,
    new_values
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_users TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;