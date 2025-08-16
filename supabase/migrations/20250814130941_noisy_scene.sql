/*
  # Add Admin Role System

  1. Functions
    - `make_user_admin(email)` - Makes a user an admin
    - `remove_admin_role(email)` - Removes admin role from a user
    - `is_admin(user_id)` - Checks if a user is an admin

  2. Security
    - Only existing admins can create new admins (except for the first admin)
    - Admin role is stored in Supabase Auth metadata
    - Protected with proper security checks
*/

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID;
  admin_count INTEGER;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Count existing admins
  SELECT COUNT(*) INTO admin_count
  FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'admin';
  
  -- If no admins exist, allow anyone to create the first admin
  -- Otherwise, only existing admins can create new admins
  IF admin_count > 0 AND (current_user_id IS NULL OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = current_user_id) != 'admin') THEN
    RAISE EXCEPTION 'Only existing admins can create new admins';
  END IF;
  
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update the user's metadata to include admin role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;
  
  RETURN 'User ' || user_email || ' has been made an admin';
END;
$$;

-- Function to remove admin role
CREATE OR REPLACE FUNCTION remove_admin_role(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Only admins can remove admin roles
  IF current_user_id IS NULL OR 
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = current_user_id) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can remove admin roles';
  END IF;
  
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Remove the admin role from user's metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = target_user_id;
  
  RETURN 'Admin role removed from user ' || user_email;
END;
$$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = user_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION make_user_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;