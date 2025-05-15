/*
  # Add product management functions and triggers

  1. Changes
    - Add function to handle product changes
    - Add trigger for product changes
    - Add function for bulk product operations
    - Add function to get admin users list
    
  2. Security
    - All functions are security definer
    - Proper admin access checks
*/

-- Create function to handle product changes
CREATE OR REPLACE FUNCTION handle_product_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the change
  PERFORM log_admin_action(
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'product',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for product changes
CREATE TRIGGER on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_product_change();

-- Function to handle bulk product actions
CREATE OR REPLACE FUNCTION bulk_update_products(
  product_ids uuid[],
  action text,
  update_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can perform bulk actions';
  END IF;

  -- Perform the action
  CASE action
    WHEN 'delete' THEN
      DELETE FROM products WHERE id = ANY(product_ids);
    WHEN 'deactivate' THEN
      UPDATE products SET is_active = false WHERE id = ANY(product_ids);
    WHEN 'activate' THEN
      UPDATE products SET is_active = true WHERE id = ANY(product_ids);
    WHEN 'update' THEN
      UPDATE products 
      SET 
        name = COALESCE((update_data->>'name')::text, name),
        price = COALESCE((update_data->>'price')::numeric, price),
        description = COALESCE((update_data->>'description')::text, description),
        occasion = COALESCE((update_data->>'occasion')::text[], occasion),
        gender = COALESCE((update_data->>'gender')::text, gender),
        updated_at = now()
      WHERE id = ANY(product_ids);
    ELSE
      RAISE EXCEPTION 'Invalid bulk action: %', action;
  END CASE;
END;
$$;

-- Function to get admin users list
CREATE OR REPLACE FUNCTION get_admin_users(
  search_term text DEFAULT NULL,
  sort_by text DEFAULT 'email',
  sort_order text DEFAULT 'asc'
)
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_login timestamptz
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
  SELECT 
    u.id,
    u.email,
    u.is_admin,
    u.created_at,
    u.last_login
  FROM auth.users u
  WHERE 
    (search_term IS NULL OR 
     u.email ILIKE '%' || search_term || '%')
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
    END DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION bulk_update_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users TO authenticated;