/*
  # Create Orders and Addresses Tables

  ## New Tables
  
  ### `addresses`
    - `id` (uuid, primary key) - Unique identifier
    - `full_name` (text) - Nome completo do cliente
    - `phone` (text) - Telefone de contato
    - `address` (text) - Endereço completo
    - `cep` (text) - Código postal
    - `city` (text) - Cidade
    - `state` (text) - Estado
    - `street` (text) - Rua/Avenida
    - `number` (text) - Número do imóvel
    - `complement` (text) - Complemento/Referências
    - `created_at` (timestamptz) - Data de criação
  
  ### `orders`
    - `id` (uuid, primary key) - Unique identifier
    - `address_id` (uuid, foreign key) - Referência ao endereço
    - `product_name` (text) - Nome do produto
    - `product_price` (decimal) - Preço do produto
    - `product_flavor` (text) - Sabor selecionado
    - `quantity` (integer) - Quantidade
    - `total_price` (decimal) - Preço total
    - `status` (text) - Status do pedido
    - `created_at` (timestamptz) - Data de criação
  
  ## Security
    - Enable RLS on both tables
    - Add policies for public access (no auth required for MVP)
*/

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  cep text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price decimal(10,2) NOT NULL,
  product_flavor text NOT NULL,
  quantity integer DEFAULT 1,
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Anyone can insert addresses"
  ON addresses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view own addresses"
  ON addresses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view orders"
  ON orders
  FOR SELECT
  TO anon
  USING (true);