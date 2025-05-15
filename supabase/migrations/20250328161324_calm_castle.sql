/*
  # Fix Admin Console Statistics Functions

  1. Changes
    - Fix get_product_stats and get_user_stats functions
    - Ensure proper type casting for all columns
    - Fix potential permission issues
    - Make counts more reliable with coalesce

  2. Security
    - Maintains existing security model
    - Preserves all existing functionality
*/

-- Drop existing stats functions
DROP FUNCTION IF EXISTS public.get_product_stats;
DROP FUNCTION IF EXISTS public.get_user_stats;

-- Create fixed product stats function
CREATE OR REPLACE FUNCTION public.get_product_stats()
RETURNS TABLE (
  total_products bigint,
  active_products bigint,
  inactive_products bigint,
  total_value numeric,
  avg_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check admin access directly
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only admins can view product stats';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*)::bigint, 0) as total_products,
    COALESCE(COUNT(*) FILTER (WHERE is_active = true)::bigint, 0) as active_products,
    COALESCE(COUNT(*) FILTER (WHERE is_active = false OR is_active IS NULL)::bigint, 0) as inactive_products,
    COALESCE(SUM(price), 0) as total_value,
    COALESCE(AVG(price), 0) as avg_price
  FROM products;
END;
$$;

-- Create fixed user stats function
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  total_users bigint,
  admin_users bigint,
  regular_users bigint,
  active_last_30_days bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check admin access directly
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only admins can view user stats';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*)::bigint, 0) as total_users,
    COALESCE(COUNT(*) FILTER (WHERE is_admin = true)::bigint, 0) as admin_users,
    COALESCE(COUNT(*) FILTER (WHERE is_admin = false OR is_admin IS NULL)::bigint, 0) as regular_users,
    COALESCE(COUNT(*) FILTER (WHERE last_login > now() - interval '30 days')::bigint, 0) as active_last_30_days
  FROM auth.users;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_product_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;