/*
  # Fix ambiguous role reference in get_users function

  1. Changes
    - Qualify the role parameter references in the WHERE clause
    - This fixes the "column reference role is ambiguous" error
    - Drop and recreate the get_users function with fixed code

  2. Security
    - Maintains existing security model
    - Preserves all existing functionality
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_users;

-- Create new version with fixed role references
CREATE OR REPLACE FUNCTION public.get_users(
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
      (get_users.role IS NULL OR 
       (get_users.role = 'admin' AND u.is_admin = true) OR 
       (get_users.role = 'regular' AND u.is_admin = false))
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users TO authenticated;