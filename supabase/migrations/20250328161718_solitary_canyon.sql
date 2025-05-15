/*
  # Fix Product Count in Admin Console
  
  1. Changes
    - Completely rewrite the get_product_stats function
    - Remove dependency on is_admin() function
    - Simplify the query structure
    - Add direct access to product table
    - Ensure all counts are properly calculated
    
  2. Security
    - Maintains proper admin-only access
    - Uses direct permission checking for reliability
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_product_stats;

-- Create a completely rewritten version of the function
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
SET search_path = public, auth
AS $$
BEGIN
  -- Direct admin check - more reliable than using is_admin()
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can view product stats';
  END IF;

  -- Simple direct query against products table
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::bigint FROM products) as total_products,
    (SELECT COUNT(*)::bigint FROM products WHERE is_active = true) as active_products,
    (SELECT COUNT(*)::bigint FROM products WHERE is_active = false OR is_active IS NULL) as inactive_products,
    (SELECT COALESCE(SUM(price), 0) FROM products) as total_value,
    (SELECT COALESCE(AVG(price), 0) FROM products) as avg_price;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_product_stats() TO authenticated;

-- For debugging: add a simple function to count products directly
CREATE OR REPLACE FUNCTION public.count_products()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::bigint FROM products;
$$;

GRANT EXECUTE ON FUNCTION public.count_products() TO authenticated;