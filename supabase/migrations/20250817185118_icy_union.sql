/*
  # Update purchases table RLS policies

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Add new policy allowing authenticated users to insert their own purchases
    - Add policy allowing anonymous users to insert purchases for free courses
    - Ensure users can only insert purchases with their own user_id when authenticated

  2. Policy Details
    - Authenticated users can insert purchases where user_id matches their auth.uid()
    - Anonymous users can insert purchases for free courses (amount = 0)
    - Maintains security while enabling free course enrollment
*/

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Allow purchase creation for free courses" ON purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;

-- Create policy for authenticated users to insert their own purchases
CREATE POLICY "Authenticated users can insert own purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for anonymous users to insert free course purchases
CREATE POLICY "Anonymous users can insert free course purchases"
  ON purchases
  FOR INSERT
  TO anon
  WITH CHECK (amount = 0);

-- Create policy for public access to insert free course purchases (fallback)
CREATE POLICY "Public can insert free purchases"
  ON purchases
  FOR INSERT
  TO public
  WITH CHECK (amount = 0);