import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
}

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (fetchError) throw fetchError;

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'trialing':
        return 'text-blue-600 dark:text-blue-400';
      case 'past_due':
      case 'unpaid':
        return 'text-red-600 dark:text-red-400';
      case 'canceled':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'trialing':
        return 'Período de Teste';
      case 'past_due':
        return 'Pagamento Atrasado';
      case 'unpaid':
        return 'Não Pago';
      case 'canceled':
        return 'Cancelada';
      case 'incomplete':
        return 'Incompleta';
      case 'not_started':
        return 'Não Iniciada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return <CheckCircle className="w-6 h-6" />;
      case 'past_due':
      case 'unpaid':
      case 'canceled':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const [planDetails, setPlanDetails] = useState<{name: string, price: string} | null>(null);

  useEffect(() => {
    if (subscription?.price_id) {
      fetchPlanDetails(subscription.price_id);
    }
  }, [subscription]);

  const fetchPlanDetails = async (priceId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('name, price_monthly')
        .eq('stripe_price_id', priceId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlanDetails({
          name: data.name,
          price: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(data.price_monthly)
        });
      } else {
        setPlanDetails({ name: 'Plano Personalizado', price: 'Consulte' });
      }
    } catch (err) {
      console.error('Error fetching plan details:', err);
      setPlanDetails({ name: 'Plano Desconhecido', price: 'N/A' });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando informações...</span>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.subscription_status !== 'not_started' && subscription.subscription_status !== 'canceled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Voltar ao Dashboard</span>
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Gerenciar Assinatura</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
            Minha Assinatura
          </h1>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Erro ao carregar dados</h3>
                <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!hasActiveSubscription ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-6">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nenhuma Assinatura Ativa
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Você ainda não possui uma assinatura ativa. Escolha um plano para desbloquear todos os recursos da plataforma.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Zap className="w-5 h-5" />
                <span>Ver Planos Disponíveis</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${getStatusColor(subscription.subscription_status)} bg-white rounded-full p-3`}>
                      {getStatusIcon(subscription.subscription_status)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {planDetails?.name || 'Carregando...'}
                      </h2>
                      <p className="text-blue-100">
                        Status: {getStatusText(subscription.subscription_status)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {planDetails?.price || 'N/A'}
                    </div>
                    <div className="text-blue-100 text-sm">por mês</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {subscription.subscription_status === 'trialing' && subscription.current_period_end && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300">Período de Teste Gratuito</h4>
                        <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                          Seu período de teste termina em {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {subscription.current_period_start && subscription.current_period_end && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Período Atual</h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {formatDate(subscription.current_period_start)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        até {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  )}

                  {subscription.payment_method_brand && subscription.payment_method_last4 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Método de Pagamento</h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">Cancelamento Agendado</h4>
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                          Sua assinatura será cancelada no final do período atual
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Alterar Plano</span>
              </button>

              <button
                onClick={() => window.open('https://billing.stripe.com/p/login/test_00g6s4cRf5kx8N2288', '_blank')}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
              >
                <CreditCard className="w-5 h-5" />
                <span>Gerenciar no Stripe</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
