import React from 'react';

interface Pedido {
  id: string;
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
  data_pedido?: string;
  forma_pagamento?: string;
  observacoes?: string;
  desconto?: number;
  taxa_entrega?: number;
  total_produtos?: number;
  codigo_rastreamento?: string;
  previsao_entrega?: string;
  vendedor_responsavel?: string;
  comissao_vendedor?: number;
  categoria_produto?: string;
  peso_total?: number;
  dimensoes?: string;
  origem_pedido?: string;
  cupom_desconto?: string;
  pontos_fidelidade?: number;
  invoiceUrl?: string;
  id_asaas?: string;
  id_conversa?: string;
  created_at: string;
  updated_at: string;
}

interface OrderReceiptPrintProps {
  pedido: Pedido;
}

const OrderReceiptPrint: React.FC<OrderReceiptPrintProps> = ({ pedido }) => {
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
    if (!rua && !numero && !bairro) return 'Endereço não informado';
    
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

  return (
    <>
      <div className="receipt-print-container">
        {/* CABEÇALHO */}
        <div className="receipt-header">
          <h1 className="receipt-title">ATENDOS IA</h1>
          <h2 className="receipt-subtitle">COMPROVANTE DE PEDIDO</h2>
          <p className="receipt-date">{new Date().toLocaleString('pt-BR')}</p>
        </div>

        {/* DADOS DO PEDIDO */}
        <div className="receipt-section">
          <h3 className="section-title">DADOS DO PEDIDO</h3>
          <div className="receipt-line">
            <span className="label">PEDIDO #:</span>
            <span className="value">#{pedido.pedido_id}</span>
          </div>
          {pedido.nome_cliente && (
            <div className="receipt-line">
              <span className="label">CLIENTE:</span>
              <span className="value">{pedido.nome_cliente}</span>
            </div>
          )}
          {pedido.agente_nome && (
            <div className="receipt-line">
              <span className="label">AGENTE:</span>
              <span className="value">{pedido.agente_nome}</span>
            </div>
          )}
          <div className="receipt-line">
            <span className="label">STATUS:</span>
            <span className="value">{pedido.status.toUpperCase()}</span>
          </div>
          {pedido.data_pedido && (
            <div className="receipt-line">
              <span className="label">DATA:</span>
              <span className="value">{new Date(pedido.data_pedido).toLocaleString('pt-BR')}</span>
            </div>
          )}
          {pedido.origem_pedido && (
            <div className="receipt-line">
              <span className="label">ORIGEM:</span>
              <span className="value">{pedido.origem_pedido}</span>
            </div>
          )}
        </div>

        {/* VALORES */}
        <div className="receipt-section">
          <h3 className="section-title">VALORES</h3>
          {pedido.total_produtos && (
            <div className="receipt-line">
              <span className="label">PRODUTOS:</span>
              <span className="value">{formatCurrency(pedido.total_produtos)}</span>
            </div>
          )}
          {pedido.taxa_entrega && (
            <div className="receipt-line">
              <span className="label">ENTREGA:</span>
              <span className="value">{formatCurrency(pedido.taxa_entrega)}</span>
            </div>
          )}
          {pedido.desconto && (
            <div className="receipt-line">
              <span className="label">DESCONTO:</span>
              <span className="value">-{formatCurrency(pedido.desconto)}</span>
            </div>
          )}
          <div className="receipt-separator"></div>
          <div className="receipt-line total-line">
            <span className="label">TOTAL:</span>
            <span className="value total-value">{formatCurrency(pedido.valor)}</span>
          </div>
          {pedido.forma_pagamento && (
            <div className="receipt-line">
              <span className="label">PAGAMENTO:</span>
              <span className="value">{pedido.forma_pagamento}</span>
            </div>
          )}
        </div>

        {/* DESCRIÇÃO DO PEDIDO */}
        <div className="receipt-section">
          <h3 className="section-title">DESCRIÇÃO DO PEDIDO</h3>
          <div className="receipt-description">
            {pedido.resumo}
          </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="receipt-section">
          <h3 className="section-title">DADOS DO CLIENTE</h3>
          <div className="receipt-line">
            <span className="label">WHATSAPP:</span>
            <span className="value">{formatPhone(pedido.whatsapp)}</span>
          </div>
          <div className="receipt-line">
            <span className="label">ENDEREÇO:</span>
            <span className="value">{formatAddress(pedido)}</span>
          </div>
          {pedido.categoria_produto && (
            <div className="receipt-line">
              <span className="label">CATEGORIA:</span>
              <span className="value">{pedido.categoria_produto}</span>
            </div>
          )}
        </div>

        {/* ENTREGA */}
        {(pedido.codigo_rastreamento || pedido.previsao_entrega || pedido.peso_total || pedido.dimensoes) && (
          <div className="receipt-section">
            <h3 className="section-title">ENTREGA</h3>
            {pedido.codigo_rastreamento && (
              <div className="receipt-line">
                <span className="label">RASTREAMENTO:</span>
                <span className="value">{pedido.codigo_rastreamento}</span>
              </div>
            )}
            {pedido.previsao_entrega && (
              <div className="receipt-line">
                <span className="label">PREVISÃO:</span>
                <span className="value">{new Date(pedido.previsao_entrega).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {pedido.peso_total && (
              <div className="receipt-line">
                <span className="label">PESO:</span>
                <span className="value">{pedido.peso_total}kg</span>
              </div>
            )}
            {pedido.dimensoes && (
              <div className="receipt-line">
                <span className="label">DIMENSÕES:</span>
                <span className="value">{pedido.dimensoes}</span>
              </div>
            )}
          </div>
        )}

        {/* VENDEDOR */}
        {(pedido.vendedor_responsavel || pedido.comissao_vendedor) && (
          <div className="receipt-section">
            <h3 className="section-title">VENDEDOR</h3>
            {pedido.vendedor_responsavel && (
              <div className="receipt-line">
                <span className="label">RESPONSÁVEL:</span>
                <span className="value">{pedido.vendedor_responsavel}</span>
              </div>
            )}
            {pedido.comissao_vendedor && (
              <div className="receipt-line">
                <span className="label">COMISSÃO:</span>
                <span className="value">{formatCurrency(pedido.comissao_vendedor)}</span>
              </div>
            )}
          </div>
        )}

        {/* PAGAMENTO */}
        {(pedido.id_asaas || pedido.invoiceUrl || pedido.cupom_desconto || pedido.pontos_fidelidade) && (
          <div className="receipt-section">
            <h3 className="section-title">PAGAMENTO</h3>
            {pedido.id_asaas && (
              <div className="receipt-line">
                <span className="label">ID ASAAS:</span>
                <span className="value">{pedido.id_asaas}</span>
              </div>
            )}
            {pedido.invoiceUrl && (
              <div className="receipt-line">
                <span className="label">FATURA:</span>
                <span className="value">DISPONÍVEL</span>
              </div>
            )}
            {pedido.cupom_desconto && (
              <div className="receipt-line">
                <span className="label">CUPOM:</span>
                <span className="value">{pedido.cupom_desconto}</span>
              </div>
            )}
            {pedido.pontos_fidelidade && (
              <div className="receipt-line">
                <span className="label">PONTOS:</span>
                <span className="value">{pedido.pontos_fidelidade}</span>
              </div>
            )}
          </div>
        )}

        {/* OBSERVAÇÕES */}
        {pedido.observacoes && (
          <div className="receipt-section">
            <h3 className="section-title">OBSERVAÇÕES</h3>
            <div className="receipt-description">
              {pedido.observacoes}
            </div>
          </div>
        )}

        {/* RODAPÉ */}
        <div className="receipt-footer">
          <h3 className="footer-title">OBRIGADO PELA PREFERÊNCIA!</h3>
          <p className="footer-website">www.atendos.com.br</p>
          <p className="footer-service">ATENDIMENTO 24H COM IA</p>
          <p className="footer-phone">(35) 98707-9368</p>
        </div>
      </div>

      {/* ESTILOS CSS PARA IMPRESSÃO */}
      <style jsx>{`
        @media print {
          /* Ocultar tudo por padrão */
          body * {
            visibility: hidden !important;
          }
          
          /* Mostrar apenas o comprovante */
          .receipt-print-container,
          .receipt-print-container * {
            visibility: visible !important;
          }
          
          .receipt-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 8mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-family: 'Arial Black', Arial, sans-serif !important;
          }
          
          /* FORÇAR NEGRITO EM TUDO */
          .receipt-print-container *,
          .receipt-header *,
          .receipt-section *,
          .receipt-footer *,
          .receipt-title,
          .receipt-subtitle,
          .receipt-date,
          .section-title,
          .receipt-line,
          .label,
          .value,
          .receipt-description,
          .receipt-separator,
          .total-line,
          .total-value,
          .footer-title,
          .footer-website,
          .footer-service,
          .footer-phone {
            font-weight: 900 !important;
            font-family: 'Arial Black', Arial, sans-serif !important;
            color: #000 !important;
            background: transparent !important;
          }
          
          /* TAMANHOS DE FONTE GRANDES */
          .receipt-title {
            font-size: 32px !important;
            text-align: center !important;
            margin: 0 0 8px 0 !important;
            letter-spacing: 2px !important;
          }
          
          .receipt-subtitle {
            font-size: 24px !important;
            text-align: center !important;
            margin: 0 0 12px 0 !important;
          }
          
          .receipt-date {
            font-size: 18px !important;
            text-align: center !important;
            margin: 0 0 20px 0 !important;
          }
          
          .section-title {
            font-size: 22px !important;
            margin: 15px 0 8px 0 !important;
            text-align: center !important;
            text-decoration: underline !important;
          }
          
          .receipt-line {
            font-size: 20px !important;
            margin: 8px 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          
          .label {
            font-size: 20px !important;
            font-weight: 900 !important;
          }
          
          .value {
            font-size: 20px !important;
            font-weight: 900 !important;
            text-align: right !important;
          }
          
          .total-line {
            font-size: 24px !important;
            margin: 12px 0 !important;
            border-top: 2px solid #000 !important;
            padding-top: 8px !important;
          }
          
          .total-value {
            font-size: 28px !important;
            font-weight: 900 !important;
          }
          
          .receipt-description {
            font-size: 22px !important;
            line-height: 1.4 !important;
            margin: 8px 0 !important;
            text-align: center !important;
            border: 2px solid #000 !important;
            padding: 8px !important;
          }
          
          .receipt-separator {
            border-top: 2px solid #000 !important;
            margin: 12px 0 !important;
          }
          
          .receipt-section {
            margin: 20px 0 !important;
            border: 2px solid #000 !important;
            padding: 12px !important;
          }
          
          .receipt-footer {
            margin-top: 25px !important;
            text-align: center !important;
            border: 3px solid #000 !important;
            padding: 15px !important;
          }
          
          .footer-title {
            font-size: 26px !important;
            margin: 0 0 8px 0 !important;
          }
          
          .footer-website {
            font-size: 22px !important;
            margin: 0 0 6px 0 !important;
          }
          
          .footer-service {
            font-size: 20px !important;
            margin: 0 0 6px 0 !important;
          }
          
          .footer-phone {
            font-size: 24px !important;
            margin: 0 !important;
          }
          
          /* Configuração da página */
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
        
        /* Ocultar na tela normal */
        .receipt-print-container {
          display: none;
        }
        
        @media print {
          .receipt-print-container {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};

export default OrderReceiptPrint;