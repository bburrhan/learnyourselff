/*
  # Add admin role system

  1. New Functions
    - `make_user_admin(user_email)` - Assigns admin role to a user
    - `remove_admin_role(user_email)` - Removes admin role from a user
    - `is_admin(user_id)` - Checks if a user is an admin

  2. Security
    - Only existing admins can create new admins
    - First admin must be created manually via SQL

  3. Usage
    - Call `SELECT make_user_admin('your-email@example.com');` to make yourself admin
*/

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make a user admin (can only be called by existing admins or if no admins exist)
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS text AS $$
DECLARE
  target_user_id uuid;
  admin_count integer;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Count existing admins
  SELECT COUNT(*) INTO admin_count 
  FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'admin';
  
  -- Check if current user is admin (unless no admins exist)
  IF admin_count > 0 AND NOT is_admin(current_user_id) THEN
    RETURN 'Error: Only admins can create new admins';
  END IF;
  
  -- Find the target user
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Error: User not found with email ' || user_email;
  END IF;
  
  -- Update user metadata to include admin role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;
  
  RETURN 'Success: User ' || user_email || ' is now an admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin role
CREATE OR REPLACE FUNCTION remove_admin_role(user_email text)
RETURNS text AS $$
DECLARE
  target_user_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT is_admin(current_user_id) THEN
    RETURN 'Error: Only admins can remove admin roles';
  END IF;
  
  -- Find the target user
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Error: User not found with email ' || user_email;
  END IF;
  
  -- Remove admin role from user metadata
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = target_user_id;
  
  RETURN 'Success: Admin role removed from ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION make_user_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_role(text) TO authenticated;

-- Example: Make the first user an admin (replace with your email)
-- SELECT make_user_admin('your-email@example.com');