/*
  # Create Cart Table

  1. New Tables
    - `cart_items`
      - `id` (uuid, primary key)
      - `product_name` (text)
      - `product_price` (decimal)
      - `product_flavor` (text)
      - `quantity` (integer)
      - `product_image` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cart_items` table
    - Add policy for public access since we don't have authentication yet
    
  3. Notes
    - Using public access for now since the app doesn't require authentication
    - Cart items are stored per session/device
*/

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  product_price decimal(10, 2) NOT NULL DEFAULT 0,
  product_flavor text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  product_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cart"
  ON cart_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to cart"
  ON cart_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to cart"
  ON cart_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from cart"
  ON cart_items
  FOR DELETE
  TO public
  USING (true);