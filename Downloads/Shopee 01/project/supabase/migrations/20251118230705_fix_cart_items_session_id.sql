/*
  # Fix cart_items session_id constraint

  1. Changes
    - Make session_id nullable with a default value
    - Add default value for session_id using gen_random_uuid()
  
  2. Notes
    - This allows cart items to be created without requiring a session_id
    - Each cart item will automatically get a unique session_id if not provided
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cart_items' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE cart_items ALTER COLUMN session_id DROP NOT NULL;
    ALTER TABLE cart_items ALTER COLUMN session_id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;