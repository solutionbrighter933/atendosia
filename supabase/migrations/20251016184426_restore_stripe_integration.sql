/*
  # Restore Stripe Integration with New Configuration

  1. New Tables
    - `stripe_customers`: Links Supabase users to Stripe customers
      - `user_id` (references auth.users) - The authenticated user
      - `customer_id` (text) - Stripe customer ID
      - Implements soft delete with `deleted_at`
      - Indexed for performance

    - `stripe_subscriptions`: Manages subscription data
      - `customer_id` (text, unique) - Links to stripe_customers
      - `subscription_id` (text) - Stripe subscription ID
      - `price_id` (text) - Stripe price ID matching:
        - price_1SGhqW1eiwDoRSS8BjfGYlf6 (Atendos IA Starter)
        - price_1SGhp21eiwDoRSS82COoWlp3 (Atendos IA Plus)
        - price_1SGiDO1eiwDoRSS8tBeglOHw (Atendos IA Pro)
      - `status` (enum) - Subscription status
      - Period tracking and payment method details
      - Implements soft delete

    - `stripe_orders`: Stores one-time payment information
      - `checkout_session_id` (text) - Stripe checkout session ID
      - `payment_intent_id` (text) - Stripe payment intent ID
      - `customer_id` (text) - Links to stripe_customers
      - Amount and currency tracking
      - Status enum for order lifecycle
      - Implements soft delete

  2. Views
    - `stripe_user_subscriptions`: Secure view for authenticated users
      - Joins customers and subscriptions
      - Filtered by auth.uid()
      - Excludes soft-deleted records

    - `stripe_user_orders`: Secure view for order history
      - Joins customers and orders
      - Filtered by auth.uid()
      - Excludes soft-deleted records

  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Restrictive policies: users can ONLY view their own data
    - All policies check auth.uid() and soft-delete status
    - Views use security_invoker for proper access control

  4. Important Notes
    - Webhook URL: https://gzlxgqcoodjioxnipzrc.supabase.co/functions/v1/stripe-webhook
    - Webhook secret: whsec_ZT6i2NXH3skJumXizVJ2e1h4CKziEgR7
    - All Stripe keys are configured in environment variables
    - Supports both subscription and one-time payment modes
*/

-- Drop existing objects if they exist (for idempotency)
DROP VIEW IF EXISTS stripe_user_orders CASCADE;
DROP VIEW IF EXISTS stripe_user_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TYPE IF EXISTS stripe_order_status CASCADE;
DROP TYPE IF EXISTS stripe_subscription_status CASCADE;

-- Create enum types
CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);

-- Create stripe_customers table
CREATE TABLE stripe_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz DEFAULT NULL
);

-- Create index for performance
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stripe_customers_customer_id ON stripe_customers(customer_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own customer data
CREATE POLICY "Users can view their own customer data"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Create stripe_subscriptions table
CREATE TABLE stripe_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id text UNIQUE NOT NULL,
  subscription_id text DEFAULT NULL,
  price_id text DEFAULT NULL,
  current_period_start bigint DEFAULT NULL,
  current_period_end bigint DEFAULT NULL,
  cancel_at_period_end boolean DEFAULT false NOT NULL,
  payment_method_brand text DEFAULT NULL,
  payment_method_last4 text DEFAULT NULL,
  status stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz DEFAULT NULL
);

-- Create index for performance
CREATE INDEX idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stripe_subscriptions_status ON stripe_subscriptions(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own subscription data
CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Create stripe_orders table
CREATE TABLE stripe_orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    checkout_session_id text NOT NULL,
    payment_intent_id text NOT NULL,
    customer_id text NOT NULL,
    amount_subtotal bigint NOT NULL,
    amount_total bigint NOT NULL,
    currency text NOT NULL,
    payment_status text NOT NULL,
    status stripe_order_status NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX idx_stripe_orders_customer_id ON stripe_orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stripe_orders_checkout_session_id ON stripe_orders(checkout_session_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stripe_orders_status ON stripe_orders(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own order data
CREATE POLICY "Users can view their own order data"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Create secure view for user subscriptions
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.id IS NULL);

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

-- Create secure view for user orders
CREATE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (o.deleted_at IS NULL OR o.id IS NULL);

GRANT SELECT ON stripe_user_orders TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at BEFORE UPDATE ON stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_orders_updated_at BEFORE UPDATE ON stripe_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
