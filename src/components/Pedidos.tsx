import React, { useState, useEffect } from 'react';
import { Package, Printer, MessageSquare, Trash2, Eye, RefreshCw, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { zapiService } from '../services/zapi.service';

interface Pedido {
  pedido_id: number;
  nome_cliente?: string;
  agente_nome?: string;
  resumo: string;
  valor: number;
  status: string;
  whatsapp?: string;
  rua?: string;
  bairro?: string;
  numero?: string;
  Entrega?: string;
  forma_pagamento?: string;
  observacoes?: string;
  desconto?: number;
  taxa_entrega?: number;
  total_produtos?: number;
  invoiceUrl?: string;
  id_asaas?: string;
  id_conversa: string;
  created_at: string;
}

const Pedidos: React.FC = () => {
  const { user, profile } = useAuthContext();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPhone = (phone?: string): string => {
    if (!phone) return 'N/A';
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 10) {
      const countryCode = clean.substring(0, 2);
      const areaCode = clean.substring(2, 4);
      const firstPart = clean.substring(4, clean.length - 4);
      const lastPart = clean.substring(clean.length - 4);
      return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }
    return phone;
  };

  const formatAddress = (pedido: Pedido): string => {
    const { rua, numero, bairro } = pedido;
    if (!rua && !numero && !bairro) return 'ENDEREÇO NÃO INFORMADO';
    const parts = [];
    if (rua) {
      if (numero) {
        parts.push(`${rua}, ${numero}`);
      } else {
        parts.push(rua);
      }
    } else if (numero) {
      parts.push(`Nº ${numero}`);
    }
    if (bairro) parts.push(bairro);
    return parts.join(' - ');
  };

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !profile?.organization_id) {
        throw new Error('Usuário ou organização não encontrados');
      }

      const { data, error: fetchError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .order('pedido_id', { ascending: false });

      if (fetchError) throw fetchError;

      setPedidos(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && profile?.organization_id) {
      loadPedidos();
    }
  }, [user?.id, profile?.organization_id]);

  const printOrder = (pedido: Pedido) => {
    setPrintingOrderId(pedido.pedido_id);

    const printWindow = window.open('', '_blank', 'width=400,height=800');
    if (!printWindow) {
      setError('Não foi possível abrir a janela de impressão');
      setPrintingOrderId(null);
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido #${pedido.pedido_id}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 80mm;
      font-family: 'Arial Black', Arial, sans-serif;
      font-weight: 900;
      color: #000;
      background: #fff;
      padding: 5mm;
      font-size: 14pt;
      line-height: 1.4;
    }

    .header {
      text-align: center;
      border-bottom: 4px solid #000;
      padding-bottom: 4mm;
      margin-bottom: 5mm;
    }

    .company-name {
      font-size: 26pt;
      font-weight: 900;
      margin-bottom: 2mm;
      letter-spacing: 1px;
    }

    .doc-title {
      font-size: 20pt;
      font-weight: 900;
      margin-bottom: 2mm;
    }

    .date {
      font-size: 13pt;
      font-weight: 900;
    }

    .section {
      margin: 4mm 0;
      border: 3px solid #000;
      padding: 3mm;
    }

    .section-title {
      font-size: 18pt;
      font-weight: 900;
      text-align: center;
      margin-bottom: 3mm;
      text-decoration: underline;
      text-transform: uppercase;
    }

    .field {
      margin: 2mm 0;
      font-size: 14pt;
      font-weight: 900;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .field-label {
      font-weight: 900;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .field-value {
      font-weight: 900;
      text-align: right;
      word-wrap: break-word;
      max-width: 50%;
    }

    .field-full {
      flex-direction: column;
      align-items: flex-start;
    }

    .field-full .field-value {
      text-align: left;
      max-width: 100%;
      margin-top: 1mm;
    }

    .total-section {
      border: 4px double #000;
      padding: 4mm;
      margin: 4mm 0;
      text-align: center;
    }

    .total-label {
      font-size: 22pt;
      font-weight: 900;
      margin-bottom: 2mm;
    }

    .total-value {
      font-size: 26pt;
      font-weight: 900;
    }

    .footer {
      text-align: center;
      border-top: 4px solid #000;
      padding-top: 4mm;
      margin-top: 5mm;
    }

    .footer-title {
      font-size: 18pt;
      font-weight: 900;
      margin-bottom: 2mm;
    }

    .footer-text {
      font-size: 14pt;
      font-weight: 900;
      margin: 1mm 0;
    }

    .footer-phone {
      font-size: 16pt;
      font-weight: 900;
      margin-top: 2mm;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${(pedido.agente_nome || 'ATENDOS IA').toUpperCase()}</div>
    <div class="doc-title">COMPROVANTE DE PEDIDO</div>
    <div class="date">${new Date().toLocaleString('pt-BR')}</div>
  </div>

  <div class="section">
    <div class="section-title">DADOS DO PEDIDO</div>

    <div class="field">
      <span class="field-label">ID:</span>
      <span class="field-value">#${pedido.pedido_id}</span>
    </div>

    ${pedido.nome_cliente ? `
    <div class="field">
      <span class="field-label">NOME DO CLIENTE:</span>
      <span class="field-value">${pedido.nome_cliente.toUpperCase()}</span>
    </div>` : ''}

    ${pedido.agente_nome ? `
    <div class="field">
      <span class="field-label">AGENTE RESPONSÁVEL:</span>
      <span class="field-value">${pedido.agente_nome.toUpperCase()}</span>
    </div>` : ''}

    <div class="field">
      <span class="field-label">STATUS:</span>
      <span class="field-value">${(pedido.status || 'PENDENTE').toUpperCase()}</span>
    </div>

    ${pedido.whatsapp ? `
    <div class="field">
      <span class="field-label">WHATSAPP:</span>
      <span class="field-value">${formatPhone(pedido.whatsapp)}</span>
    </div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">RESUMO DO PEDIDO</div>
    <div class="field field-full">
      <span class="field-value">${pedido.resumo.toUpperCase()}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ENDEREÇO DE ENTREGA</div>
    <div class="field field-full">
      <span class="field-value">${formatAddress(pedido).toUpperCase()}</span>
    </div>
    ${pedido.Entrega ? `
    <div class="field" style="margin-top: 2mm;">
      <span class="field-label">ENTREGA:</span>
      <span class="field-value">${pedido.Entrega.toUpperCase()}</span>
    </div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">VALORES</div>

    ${pedido.total_produtos ? `
    <div class="field">
      <span class="field-label">PRODUTOS:</span>
      <span class="field-value">${formatCurrency(pedido.total_produtos)}</span>
    </div>` : ''}

    ${pedido.taxa_entrega ? `
    <div class="field">
      <span class="field-label">TAXA ENTREGA:</span>
      <span class="field-value">${formatCurrency(pedido.taxa_entrega)}</span>
    </div>` : ''}

    ${pedido.desconto ? `
    <div class="field">
      <span class="field-label">DESCONTO:</span>
      <span class="field-value">-${formatCurrency(pedido.desconto)}</span>
    </div>` : ''}

    ${pedido.forma_pagamento ? `
    <div class="field">
      <span class="field-label">FORMA DE PAGAMENTO:</span>
      <span class="field-value">${pedido.forma_pagamento.toUpperCase()}</span>
    </div>` : ''}
  </div>

  <div class="total-section">
    <div class="total-label">VALOR TOTAL</div>
    <div class="total-value">${formatCurrency(pedido.valor)}</div>
  </div>

  ${pedido.observacoes ? `
  <div class="section">
    <div class="section-title">OBSERVAÇÕES</div>
    <div class="field field-full">
      <span class="field-value">${pedido.observacoes.toUpperCase()}</span>
    </div>
  </div>` : ''}

  <div class="footer">
    <div class="footer-title">OBRIGADO PELA PREFERÊNCIA!</div>
    <div class="footer-text">WWW.ATENDOS.COM.BR</div>
    <div class="footer-text">ATENDIMENTO 24H COM IA</div>
    <div class="footer-phone">(35) 98707-9368</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() {
          window.close();
        }, 500);
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      setPrintingOrderId(null);
    }, 2000);
  };

  const openMessageModal = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCustomMessage(`Olá! Sobre seu pedido #${pedido.pedido_id}, gostaria de informar que...`);
    setShowMessageModal(true);
  };

  const openCancelModal = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCancelMessage(`Olá! Infelizmente precisamos cancelar seu pedido #${pedido.pedido_id}. Pedimos desculpas pelo inconveniente.`);
    setShowCancelModal(true);
  };

  const sendCustomMessage = async () => {
    if (!selectedPedido || !customMessage.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      if (!zapiService.isConfigured()) {
        throw new Error('Z-API não configurada');
      }

      const result = await zapiService.sendTextMessage(selectedPedido.id_conversa, customMessage.trim());

      if (!result.success) {
        throw new Error(result.error || 'Falha ao enviar mensagem');
      }

      setSuccess('Mensagem enviada com sucesso!');
      setShowMessageModal(false);
      setCustomMessage('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const cancelOrder = async () => {
    if (!selectedPedido) return;

    try {
      setCancelingOrder(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('pedidos')
        .delete()
        .eq('pedido_id', selectedPedido.pedido_id)
        .eq('user_id', user?.id)
        .eq('organization_id', profile?.organization_id);

      if (deleteError) throw deleteError;

      if (cancelMessage.trim() && zapiService.isConfigured()) {
        try {
          await zapiService.sendTextMessage(selectedPedido.id_conversa, cancelMessage.trim());
        } catch (msgError) {
          console.warn('Erro ao enviar mensagem de cancelamento:', msgError);
        }
      }

      setSuccess('Pedido cancelado com sucesso!');
      setShowCancelModal(false);
      setCancelMessage('');
      await loadPedidos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar pedido');
    } finally {
      setCancelingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando pedidos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h2>
        <button
          onClick={loadPedidos}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-600 dark:text-green-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {pedidos.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome do Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agente Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resumo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entrega
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pedidos.map((pedido) => (
                  <tr key={pedido.pedido_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">#{pedido.pedido_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">{pedido.nome_cliente || 'Não informado'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">{pedido.agente_nome || 'Não informado'}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm text-gray-900 dark:text-white line-clamp-2">{pedido.resumo}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(pedido.valor)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pedido.status?.toLowerCase() === 'pago'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {pedido.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">{formatPhone(pedido.whatsapp)}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm text-gray-900 dark:text-white line-clamp-2">{formatAddress(pedido)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">{pedido.Entrega || '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {pedido.invoiceUrl && (
                          <a
                            href={pedido.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Ver fatura"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => printOrder(pedido)}
                          disabled={printingOrderId === pedido.pedido_id}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50"
                          title="Imprimir comprovante"
                        >
                          {printingOrderId === pedido.pedido_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Printer className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openMessageModal(pedido)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          title="Enviar mensagem"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openCancelModal(pedido)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Cancelar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400">Os pedidos aparecerão aqui quando forem criados.</p>
            </div>
          )}
        </div>
      </div>

      {showMessageModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enviar Mensagem</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>Pedido:</strong> #{selectedPedido.pedido_id}
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>Cliente:</strong> {formatPhone(selectedPedido.id_conversa)}
                </p>
              </div>

              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite sua mensagem..."
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendCustomMessage}
                  disabled={!customMessage.trim() || sendingMessage}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{sendingMessage ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cancelar Pedido</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-300 font-medium">Esta ação não pode ser desfeita!</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-gray-800 dark:text-gray-300 text-sm">
                  <strong>Pedido:</strong> #{selectedPedido.pedido_id}
                </p>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  <strong>Valor:</strong> {formatCurrency(selectedPedido.valor)}
                </p>
              </div>

              <textarea
                value={cancelMessage}
                onChange={(e) => setCancelMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Mensagem de cancelamento (opcional)..."
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={cancelOrder}
                  disabled={cancelingOrder}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {cancelingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{cancelingOrder ? 'Cancelando...' : 'Confirmar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {printingOrderId && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Imprimindo pedido #{printingOrderId}...</span>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
