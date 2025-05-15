/*
  # Add indexes and stats functions

  1. Changes
    - Add pg_trgm extension for better text search
    - Add indexes for better query performance
    - Add functions for product and user statistics
    - Add function for audit log retrieval

  2. Security
    - All functions are security definer
    - Proper admin access checks
*/

-- Add extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS products_name_idx ON products USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS products_keywords_idx ON products USING gin (keywords);
CREATE INDEX IF NOT EXISTS products_occasion_idx ON products USING gin (occasion);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at);
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);

-- Function to get product stats
CREATE OR REPLACE FUNCTION get_product_stats()
RETURNS TABLE (
  total_products bigint,
  active_products bigint,
  inactive_products bigint,
  total_value numeric,
  avg_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can view product stats';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_products,
    COUNT(*) FILTER (WHERE is_active)::bigint as active_products,
    COUNT(*) FILTER (WHERE NOT is_active)::bigint as inactive_products,
    SUM(price) as total_value,
    AVG(price) as avg_price
  FROM products;
END;
$$;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users bigint,
  admin_users bigint,
  regular_users bigint,
  active_last_30_days bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can view user stats';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE is_admin)::bigint as admin_users,
    COUNT(*) FILTER (WHERE NOT is_admin)::bigint as regular_users,
    COUNT(*) FILTER (WHERE last_login > now() - interval '30 days')::bigint as active_last_30_days
  FROM auth.users;
END;
$$;

-- Function to get recent audit logs
CREATE OR REPLACE FUNCTION get_recent_audit_logs(
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
    u.email as admin_email,
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
GRANT EXECUTE ON FUNCTION get_product_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_audit_logs TO authenticated;