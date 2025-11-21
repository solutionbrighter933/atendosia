/*
  # Add email column to addresses table

  ## Changes
    - Add `email` (text) column to addresses table
    - Email will be used for contact purposes in orders
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'email'
  ) THEN
    ALTER TABLE addresses ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;
