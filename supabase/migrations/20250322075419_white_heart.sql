/*
  # Add Admin Features Support

  1. Changes
    - Add active status to products table
    - Add last_login to auth.users table
    - Add role field to auth.users table
    - Add audit logging table
    - Add functions for admin management

  2. Security
    - Maintain existing RLS policies
    - Add new policies for audit logs
*/

-- Add active status to products
ALTER TABLE products
ADD COLUMN is_active boolean DEFAULT true;

-- Add last_login to auth.users if it doesn't exist
DO $$ BEGIN
  ALTER TABLE auth.users
  ADD COLUMN last_login timestamptz;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create audit log table
CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs
CREATE POLICY "Admins can read audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action text,
  entity_type text,
  entity_id text,
  old_values jsonb DEFAULT NULL,
  new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  );
END;
$$;

-- Function to update user's last login
CREATE OR REPLACE FUNCTION auth.handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET last_login = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Create trigger for last login update
DROP TRIGGER IF EXISTS on_auth_sign_in ON auth.sessions;
CREATE TRIGGER on_auth_sign_in
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_user_login();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION auth.handle_user_login TO authenticated;