/*
  # Fix type mismatch in get_recent_audit_logs function

  1. Changes
    - Fix the type mismatch between function definition and query result
    - The error was "Returned type character varying(255) does not match expected type text in column 2"
    - Cast email column to text to match the function's return type

  2. Security
    - Maintains existing security model
    - Preserves all existing functionality
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_recent_audit_logs;

-- Create new version with fixed type casting
CREATE OR REPLACE FUNCTION public.get_recent_audit_logs(
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  admin_email text,
  action text,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can view audit logs';
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    u.email::text as admin_email, -- Explicitly cast email to text
    l.action,
    l.entity_type,
    l.entity_id,
    l.old_values,
    l.new_values,
    l.created_at
  FROM admin_audit_logs l
  LEFT JOIN auth.users u ON l.admin_id = u.id
  ORDER BY l.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_recent_audit_logs(integer) TO authenticated;