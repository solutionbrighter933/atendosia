export interface Product {
  priceId: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  mode: 'payment' | 'subscription';
  trialDays?: number;
  popular?: boolean;
}

export const products: Product[] = [
  {
    priceId: 'price_1Ri0FK09PxhT9skqmRPwZNCa',
    name: 'Atendos IA Starter',
    price: 'R$ 796,00/mês',
    description: 'Starter - Plano ideal para começar com automação de atendimento',
    features: [
      'Atendimento automatizado com IA',
      'Integração com WhatsApp',
      'Dashboard completo',
      'Suporte técnico',
      'Treinamento personalizado da IA',
      'Até 2.000 mensagens/mês',
      'Integração automática com Google Sheets via IA',
      'Agente de agendamento via Google Calendar integrado'
    ],
    mode: 'subscription',
  },
  {
    priceId: 'price_1Rkur809PxhT9skqT19kNwd9',
    name: 'Atendos IA Plus',
    price: 'R$ 1.192,00/mês',
    description: 'Plus - A Máquina de Conversão no Bolso',
    features: [
      '3.000 mensagens mensais com IA ativa 24h no automático',
      'Atendimento completo no Instagram Direct + WhatsApp',
      'Respostas adaptativas inteligentes que se moldam ao tom do cliente',
      'Monitoramento de leads em tempo real',
      'Funil de vendas invisível — o lead nem percebe que foi conduzido pro checkout',
      'Análise de intenção de compra automática',
      'Integração automática com Google Sheets via IA',
      'Agente de agendamento via Google Calendar integrado'
    ],
    mode: 'subscription',
    popular: true
  },
  {
    priceId: 'price_1Rkurd09PxhT9skqA4v4IUHN',
    name: 'Atendos IA Pro',
    price: 'R$ 1.578,00/mês',
    description: 'Dominação Digital com Estilo Brutal',
    features: [
      'Mensagens ilimitadas mensais com + 500 modelos de IA disponíveis',
      'Atendimento total: WhatsApp + Instagram Direct, sem limites',
      'Integração automática com Google Sheets via IA',
      'Acesso prioritário ao suporte',
      'Modo personalização insana, treine a IA do seu jeito sem política de restrição',
      'Agente SDR com follow-up automático',
      'Agente de voz que liga, qualifica e marca reunião sozinho',
      'Agente de agendamento via Google Calendar integrado',
      'Agente vendedor com carrinho de compras embutido (Pix, boleto, crédito)',
      'Smart Delivery: Gestão completa de pedidos e entregas com IA',
      'Atendos Meeting: Notetaker com IA para Zoom, Meet e Teams',
      'Emissão automática de notas fiscais pós-venda',
      'Integrações ilimitadas: CRM, Telegram, Apple Calendar, Stripe, Asaas',
      'Gerador de Leads B2B: Gere centenas de leads em minutos'
    ],
    mode: 'subscription',
  }
];