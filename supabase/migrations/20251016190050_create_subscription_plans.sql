/*
  # Create Subscription Plans System

  1. New Tables
    - `subscription_plans`: Stores all available subscription plans
      - `id` (uuid, primary key)
      - `name` (text) - Plan name (e.g., "Atendos IA Starter")
      - `slug` (text, unique) - URL-friendly identifier
      - `description` (text) - Plan description
      - `price_monthly` (numeric) - Monthly price in BRL
      - `stripe_price_id` (text, nullable) - Stripe Price ID (can be null)
      - `features` (jsonb) - Array of features
      - `is_popular` (boolean) - Mark as popular plan
      - `is_active` (boolean) - Enable/disable plan
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Views
    - `active_subscription_plans`: Public view of active plans

  3. Security
    - RLS enabled on subscription_plans
    - Public can view active plans
    - Only authenticated users with admin role can modify

  4. Important Notes
    - Plans are now managed in the database
    - No more hardcoded Price IDs in frontend
    - stripe_price_id can be added later via admin interface
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  stripe_price_id text DEFAULT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_popular boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for active plans
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug) WHERE is_active = true;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
    ON subscription_plans
    FOR SELECT
    USING (is_active = true);

-- Policy: Authenticated users can view all plans (for admin)
CREATE POLICY "Authenticated users can view all plans"
    ON subscription_plans
    FOR SELECT
    TO authenticated
    USING (true);

-- Create view for active plans
CREATE VIEW active_subscription_plans AS
SELECT
    id,
    name,
    slug,
    description,
    price_monthly,
    stripe_price_id,
    features,
    is_popular,
    sort_order
FROM subscription_plans
WHERE is_active = true
ORDER BY sort_order ASC;

GRANT SELECT ON active_subscription_plans TO anon;
GRANT SELECT ON active_subscription_plans TO authenticated;

-- Add trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, features, is_popular, sort_order, stripe_price_id) VALUES
(
    'Atendos IA Starter',
    'starter',
    'Plano ideal para começar com automação de atendimento',
    796.00,
    '[
        "Atendimento automatizado com IA",
        "Integração com WhatsApp",
        "Dashboard completo",
        "Suporte técnico",
        "Treinamento personalizado da IA",
        "Até 2.000 mensagens/mês",
        "Integração automática com Google Sheets via IA",
        "Agente de agendamento via Google Calendar integrado"
    ]'::jsonb,
    false,
    1,
    NULL
),
(
    'Atendos IA Plus',
    'plus',
    'A Máquina de Conversão no Bolso',
    1192.00,
    '[
        "3.000 mensagens mensais com IA ativa 24h no automático",
        "Atendimento completo no Instagram Direct + WhatsApp",
        "Respostas adaptativas inteligentes que se moldam ao tom do cliente",
        "Monitoramento de leads em tempo real",
        "Funil de vendas invisível",
        "Análise de intenção de compra automática",
        "Integração automática com Google Sheets via IA",
        "Agente de agendamento via Google Calendar integrado"
    ]'::jsonb,
    true,
    2,
    NULL
),
(
    'Atendos IA Pro',
    'pro',
    'Dominação Digital Completa',
    1578.00,
    '[
        "Mensagens ilimitadas mensais com + 500 modelos de IA disponíveis",
        "Atendimento total: WhatsApp + Instagram Direct, sem limites",
        "Integração automática com Google Sheets via IA",
        "Acesso prioritário ao suporte",
        "Modo personalização insana, treine a IA do seu jeito",
        "Agente SDR com follow-up automático",
        "Agente de voz que liga, qualifica e marca reunião sozinho",
        "Agente de agendamento via Google Calendar integrado",
        "Agente vendedor com carrinho de compras embutido",
        "Smart Delivery: Gestão completa de pedidos e entregas com IA",
        "Atendos Meeting: Notetaker com IA para Zoom, Meet e Teams",
        "Emissão automática de notas fiscais pós-venda",
        "Integrações ilimitadas: CRM, Telegram, Apple Calendar, Stripe, Asaas",
        "Gerador de Leads B2B: Gere centenas de leads em minutos"
    ]'::jsonb,
    false,
    3,
    NULL
)
ON CONFLICT (slug) DO NOTHING;
