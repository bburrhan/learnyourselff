/*
  # Fix Storage Buckets RLS - Allow Bucket Metadata Access

  The `storage.buckets` table has RLS enabled but no policies, which blocks
  the Supabase storage client from reading bucket metadata during uploads.
  This causes "new row violates row-level security policy" errors for all
  storage operations.

  1. New Policies (storage.buckets)
    - Authenticated users can read bucket metadata (SELECT) - required for
      the storage client to validate buckets before upload/download operations

  2. Important Notes
    - This only grants SELECT on the buckets table (not objects)
    - Object-level access is still controlled by the existing policies on
      storage.objects
*/

CREATE POLICY "Authenticated users can read bucket metadata"
  ON storage.buckets FOR SELECT
  TO authenticated
  USING (true);