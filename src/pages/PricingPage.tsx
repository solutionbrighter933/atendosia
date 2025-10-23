import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Users,
  BarChart,
  CreditCard,
  Check,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  stripe_price_id: string | null;
  stripe_checkout_url: string | null;
  features: string[];
  is_popular: boolean;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('active_subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching plans from database:', fetchError);
        useFallbackPlans();
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No plans found in database, using fallback');
        useFallbackPlans();
        return;
      }

      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
      useFallbackPlans();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackPlans = () => {
    console.log('Using fallback plans data');
    const fallbackPlans: Plan[] = [
      {
        id: 'starter-fallback',
        name: 'Atendos IA Starter',
        slug: 'starter',
        description: 'Plano ideal para começar com automação de atendimento',
        price_monthly: 796.00,
        stripe_price_id: 'price_1SGhqW1eiwDoRSS8BjfGYlf6',
        stripe_checkout_url: 'https://buy.stripe.com/14AdR1awDeuOgpJc0YfIs05',
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
        is_popular: false
      },
      {
        id: 'plus-fallback',
        name: 'Atendos IA Plus',
        slug: 'plus',
        description: 'A Máquina de Conversão no Bolso',
        price_monthly: 1192.00,
        stripe_price_id: 'price_1SGhp21eiwDoRSS82COoWlp3',
        stripe_checkout_url: 'https://buy.stripe.com/6oUaEP6gn5Yi4H16GEfIs03',
        features: [
          '3.000 mensagens mensais com IA ativa 24h no automático',
          'Atendimento completo no Instagram Direct + WhatsApp',
          'Respostas adaptativas inteligentes que se moldam ao tom do cliente',
          'Monitoramento de leads em tempo real',
          'Funil de vendas invisível',
          'Análise de intenção de compra automática',
          'Integração automática com Google Sheets via IA',
          'Agente de agendamento via Google Calendar integrado'
        ],
        is_popular: true
      },
      {
        id: 'pro-fallback',
        name: 'Atendos IA Pro',
        slug: 'pro',
        description: 'Dominação Digital Completa',
        price_monthly: 1578.00,
        stripe_price_id: 'price_1SGiDO1eiwDoRSS8tBeglOHw',
        stripe_checkout_url: 'https://buy.stripe.com/fZu4gr6gn4Ue7Td1mkfIs04',
        features: [
          'Mensagens ilimitadas mensais com + 500 modelos de IA disponíveis',
          'Atendimento total: WhatsApp + Instagram Direct, sem limites',
          'Integração automática com Google Sheets via IA',
          'Acesso prioritário ao suporte',
          'Modo personalização insana, treine a IA do seu jeito',
          'Agente SDR com follow-up automático',
          'Agente de voz que liga, qualifica e marca reunião sozinho',
          'Agente de agendamento via Google Calendar integrado',
          'Agente vendedor com carrinho de compras embutido',
          'Smart Delivery: Gestão completa de pedidos e entregas com IA',
          'Atendos Meeting: Notetaker com IA para Zoom, Meet e Teams',
          'Emissão automática de notas fiscais pós-venda',
          'Integrações ilimitadas: CRM, Telegram, Apple Calendar, Stripe, Asaas',
          'Gerador de Leads B2B: Gere centenas de leads em minutos'
        ],
        is_popular: false
      }
    ];
    setPlans(fallbackPlans);
    setError(null);
  };

  const handleCheckout = (plan: Plan) => {
    try {
      setCheckoutLoading(plan.id);
      setError(null);

      if (!plan.stripe_checkout_url) {
        setError('Este plano ainda não está disponível. Entre em contato com o suporte.');
        setCheckoutLoading(null);
        return;
      }

      window.location.href = plan.stripe_checkout_url;
    } catch (err) {
      console.error('Erro no checkout:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar checkout');
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Voltar ao Dashboard</span>
        </button>

        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-5">
            <div className="w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative">
            <div className="inline-flex items-center px-4 py-2 mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Planos Premium</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
              Escolha Seu Plano
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Automatize seu atendimento com IA e impulsione suas vendas com a plataforma mais completa do mercado
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aumente as Vendas</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Converta mais leads em clientes com atendimento 24/7</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Economia de Tempo</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Automatize tarefas repetitivas e foque no que importa</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Escale seu Negócio</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Atenda milhares de clientes simultaneamente</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando planos...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum plano disponível
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Entre em contato com o suporte para mais informações.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg ${
                  plan.is_popular
                    ? 'border-2 border-blue-500 dark:border-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30 scale-105'
                    : 'border-2 border-gray-200 dark:border-gray-700'
                } p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                      <span>MAIS POPULAR</span>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <img
                      src={
                        plan.slug === 'starter' ? '/Atendos Starter Logo.png' :
                        plan.slug === 'plus' ? '/Atendos Plus Logo.png' :
                        plan.slug === 'pro' ? '/Atendos Pro Logo.png' :
                        undefined
                      }
                      alt={plan.name}
                      className="h-16 w-auto object-contain"
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {plan.slug === 'starter' ? 'Starter' :
                     plan.slug === 'plus' ? 'Plus' :
                     plan.slug === 'pro' ? 'Pro' :
                     plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[48px]">{plan.description}</p>

                  <div className="mb-6">
                    <div
                      className={`text-5xl font-extrabold mb-2 ${
                        plan.is_popular
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {formatPrice(plan.price_monthly)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">por mês</div>
                  </div>

                  <div className="space-y-4 mb-8 text-left">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                            plan.is_popular
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              : 'bg-gradient-to-br from-green-500 to-emerald-500'
                          }`}
                        >
                          <Check className="w-3 h-3 text-white font-bold" />
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutLoading === plan.id || !plan.stripe_checkout_url}
                    className={`w-full flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                      plan.is_popular
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white'
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : !plan.stripe_checkout_url ? (
                      <span>Em Breve</span>
                    ) : (
                      <>
                        <span>Começar Agora</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-200 dark:border-gray-700 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-gray-700 dark:text-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Cancele quando quiser</p>
                <p className="text-sm">Sem compromisso</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Pagamento seguro</p>
                <p className="text-sm">Processado pelo Stripe</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Sem taxas extras</p>
                <p className="text-sm">Preço transparente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Perguntas Frequentes</h2>
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Posso cancelar a qualquer momento?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Como funciona o pagamento?</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      O pagamento é processado de forma segura pelo Stripe. Você pode pagar com cartão de crédito e o valor é
                      cobrado mensalmente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Posso mudar de plano depois?</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através das configurações da sua
                      conta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Há suporte técnico disponível?</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Sim! Todos os planos incluem suporte técnico. O plano Pro conta com suporte prioritário.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
            <span className="text-gray-700 dark:text-gray-300">Tem dúvidas? Entre em contato:</span>
            <a
              href="mailto:suporte@atendos.com.br"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              suporte@atendos.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
