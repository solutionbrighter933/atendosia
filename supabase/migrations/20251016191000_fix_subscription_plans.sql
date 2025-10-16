/*
  # Fix Subscription Plans System

  1. Create helper function
    - `update_updated_at_column()` - Updates the updated_at timestamp

  2. Create subscription_plans table
    - All fields with proper constraints
    - RLS policies for public read access
    - View for active plans

  3. Insert default plans data with Stripe Price IDs
*/

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing objects if they exist
DROP VIEW IF EXISTS active_subscription_plans;
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
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

-- Create indexes
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug) WHERE is_active = true;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anon) can view active plans
CREATE POLICY "Anyone can view active plans"
    ON subscription_plans
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

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

-- Grant permissions on view
GRANT SELECT ON active_subscription_plans TO anon;
GRANT SELECT ON active_subscription_plans TO authenticated;

-- Add trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans with Stripe Price IDs
INSERT INTO subscription_plans (name, slug, description, price_monthly, features, is_popular, sort_order, stripe_price_id) VALUES
(
    'Atendos IA Starter',
    'starter',
    'Plano ideal para começar com automação de atendimento',
    796.00,
    '["Atendimento automatizado com IA", "Integração com WhatsApp", "Dashboard completo", "Suporte técnico", "Treinamento personalizado da IA", "Até 2.000 mensagens/mês", "Integração automática com Google Sheets via IA", "Agente de agendamento via Google Calendar integrado"]'::jsonb,
    false,
    1,
    'price_1SGhqW1eiwDoRSS8BjfGYlf6'
),
(
    'Atendos IA Plus',
    'plus',
    'A Máquina de Conversão no Bolso',
    1192.00,
    '["3.000 mensagens mensais com IA ativa 24h no automático", "Atendimento completo no Instagram Direct + WhatsApp", "Respostas adaptativas inteligentes que se moldam ao tom do cliente", "Monitoramento de leads em tempo real", "Funil de vendas invisível", "Análise de intenção de compra automática", "Integração automática com Google Sheets via IA", "Agente de agendamento via Google Calendar integrado"]'::jsonb,
    true,
    2,
    'price_1SGhp21eiwDoRSS82COoWlp3'
),
(
    'Atendos IA Pro',
    'pro',
    'Dominação Digital Completa',
    1578.00,
    '["Mensagens ilimitadas mensais com + 500 modelos de IA disponíveis", "Atendimento total: WhatsApp + Instagram Direct, sem limites", "Integração automática com Google Sheets via IA", "Acesso prioritário ao suporte", "Modo personalização insana, treine a IA do seu jeito", "Agente SDR com follow-up automático", "Agente de voz que liga, qualifica e marca reunião sozinho", "Agente de agendamento via Google Calendar integrado", "Agente vendedor com carrinho de compras embutido", "Smart Delivery: Gestão completa de pedidos e entregas com IA", "Atendos Meeting: Notetaker com IA para Zoom, Meet e Teams", "Emissão automática de notas fiscais pós-venda", "Integrações ilimitadas: CRM, Telegram, Apple Calendar, Stripe, Asaas", "Gerador de Leads B2B: Gere centenas de leads em minutos"]'::jsonb,
    false,
    3,
    'price_1SGiDO1eiwDoRSS8tBeglOHw'
);
