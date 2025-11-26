import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Erro na autorização do Google: ${error}`);
      setLoading(false);
      return;
    }

    if (code && user?.id && profile?.organization_id) {
      exchangeCodeForTokens(code);
    } else if (!user?.id || !profile?.organization_id) {
      setStatus('error');
      setMessage('Usuário não autenticado ou perfil não carregado. Tente novamente.');
      setLoading(false);
    } else {
      setStatus('error');
      setMessage('Código de autorização não encontrado na URL.');
      setLoading(false);
    }
  }, [location.search, user?.id, profile?.organization_id]);

  const exchangeCodeForTokens = async (code: string) => {
    try {
      console.log('🔄 Trocando código por tokens do Google Calendar...');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_CALENDAR_REDIRECT_URI;

      // Chamar a Edge Function para trocar o código por tokens
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-oauth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: GOOGLE_REDIRECT_URI,
            user_id: user?.id,
            organization_id: profile?.organization_id
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao trocar código por tokens');
      }

      const data = await response.json();
      console.log('✅ Integração concluída:', data);

      setStatus('success');
      setMessage('Integração com Google Calendar realizada com sucesso! Redirecionando...');
    } catch (err) {
      console.error('❌ Erro na troca de código por tokens:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro desconhecido ao integrar com Google Calendar.');
    } finally {
      setLoading(false);
      // Redireciona para a página do Google Calendar
      setTimeout(() => {
        if (status === 'success' || status === 'loading') {
          navigate('/google-calendar');
        } else {
          navigate('/settings?tab=google-calendar');
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md w-full">
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Processando integração...</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Por favor, aguarde enquanto configuramos sua conexão.</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sucesso!</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{message}</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Erro na Integração</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;