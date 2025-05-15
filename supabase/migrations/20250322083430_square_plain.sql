/*
  # Fix product management and add bulk operations

  1. Changes
    - Add function for bulk product operations
    - Add function for product status updates
    - Add audit logging for bulk operations

  2. Security
    - Maintain existing security model
    - Add proper RLS for admin operations
*/

-- Function to handle bulk product operations
CREATE OR REPLACE FUNCTION handle_bulk_product_operation(
  product_ids uuid[],
  operation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can perform bulk operations';
  END IF;

  -- Perform operation
  CASE operation
    WHEN 'activate' THEN
      UPDATE products SET is_active = true WHERE id = ANY(product_ids);
    WHEN 'deactivate' THEN
      UPDATE products SET is_active = false WHERE id = ANY(product_ids);
    WHEN 'delete' THEN
      DELETE FROM products WHERE id = ANY(product_ids);
    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  -- Log the action
  PERFORM log_admin_action(
    operation,
    'products',
    array_to_string(product_ids, ','),
    NULL,
    jsonb_build_object('product_ids', product_ids)
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_bulk_product_operation TO authenticated;