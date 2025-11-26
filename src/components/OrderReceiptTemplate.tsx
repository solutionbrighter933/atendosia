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

interface OrderReceiptTemplateProps {
  pedido: Pedido;
  timestamp?: string;
}

const OrderReceiptTemplate: React.FC<OrderReceiptTemplateProps> = ({ pedido, timestamp }) => {
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
    return parts.join(' - ').toUpperCase();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return new Date().toLocaleString('pt-BR');
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const currentDateTime = timestamp || new Date().toLocaleString('pt-BR');

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 3mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-receipt {
            display: block !important;
            width: 80mm !important;
            font-family: 'Arial Black', Arial, sans-serif !important;
            font-weight: 900 !important;
            color: #000 !important;
            background: #fff !important;
            padding: 5mm !important;
          }

          .receipt-header {
            text-align: center !important;
            border-bottom: 4px solid #000 !important;
            padding-bottom: 6mm !important;
            margin-bottom: 6mm !important;
          }

          .receipt-title {
            font-size: 48px !important;
            font-weight: 900 !important;
            margin: 0 0 4mm 0 !important;
            letter-spacing: 2px !important;
            text-transform: uppercase !important;
            line-height: 1.2 !important;
          }

          .receipt-subtitle {
            font-size: 36px !important;
            font-weight: 900 !important;
            margin: 0 0 4mm 0 !important;
            text-transform: uppercase !important;
          }

          .receipt-date {
            font-size: 28px !important;
            font-weight: 900 !important;
            margin: 0 !important;
          }

          .section-divider {
            border-top: 4px solid #000 !important;
            margin: 6mm 0 !important;
          }

          .section-title {
            font-size: 36px !important;
            font-weight: 900 !important;
            text-align: center !important;
            margin: 5mm 0 4mm 0 !important;
            text-transform: uppercase !important;
            text-decoration: underline !important;
          }

          .info-row {
            display: flex !important;
            justify-content: space-between !important;
            margin: 4mm 0 !important;
            font-size: 30px !important;
            font-weight: 900 !important;
            line-height: 1.3 !important;
          }

          .info-label {
            font-size: 30px !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
          }

          .info-value {
            font-size: 30px !important;
            font-weight: 900 !important;
            text-align: right !important;
            text-transform: uppercase !important;
          }

          .description-box {
            border: 4px solid #000 !important;
            padding: 4mm !important;
            margin: 4mm 0 !important;
            font-size: 32px !important;
            font-weight: 900 !important;
            text-align: center !important;
            line-height: 1.4 !important;
            text-transform: uppercase !important;
          }

          .total-section {
            border-top: 5px double #000 !important;
            border-bottom: 5px double #000 !important;
            padding: 5mm 0 !important;
            margin: 6mm 0 !important;
          }

          .total-row {
            display: flex !important;
            justify-content: space-between !important;
            font-size: 42px !important;
            font-weight: 900 !important;
            margin: 3mm 0 !important;
          }

          .total-label {
            font-size: 42px !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
          }

          .total-value {
            font-size: 48px !important;
            font-weight: 900 !important;
          }

          .receipt-footer {
            text-align: center !important;
            border-top: 5px solid #000 !important;
            padding-top: 6mm !important;
            margin-top: 8mm !important;
          }

          .footer-title {
            font-size: 38px !important;
            font-weight: 900 !important;
            margin: 0 0 4mm 0 !important;
            text-transform: uppercase !important;
          }

          .footer-text {
            font-size: 32px !important;
            font-weight: 900 !important;
            margin: 2mm 0 !important;
            text-transform: uppercase !important;
          }

          .footer-phone {
            font-size: 36px !important;
            font-weight: 900 !important;
            margin: 3mm 0 0 0 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-receipt">
        <div className="receipt-header">
          <div className="receipt-title">{pedido.agente_nome || 'ATENDOS IA'}</div>
          <div className="receipt-subtitle">COMPROVANTE DE PEDIDO</div>
          <div className="receipt-date">{currentDateTime}</div>
        </div>

        <div className="section-divider"></div>
        <div className="section-title">DADOS DO PEDIDO</div>

        <div className="info-row">
          <span className="info-label">PEDIDO:</span>
          <span className="info-value">#{pedido.pedido_id}</span>
        </div>

        {pedido.nome_cliente && (
          <div className="info-row">
            <span className="info-label">CLIENTE:</span>
            <span className="info-value">{pedido.nome_cliente.toUpperCase()}</span>
          </div>
        )}

        <div className="info-row">
          <span className="info-label">STATUS:</span>
          <span className="info-value">{(pedido.status || 'PENDENTE').toUpperCase()}</span>
        </div>

        {pedido.forma_pagamento && (
          <div className="info-row">
            <span className="info-label">PAGAMENTO:</span>
            <span className="info-value">{pedido.forma_pagamento.toUpperCase()}</span>
          </div>
        )}

        <div className="section-divider"></div>
        <div className="section-title">DESCRIÇÃO DO PEDIDO</div>
        <div className="description-box">
          {pedido.resumo.toUpperCase()}
        </div>

        <div className="section-divider"></div>
        <div className="section-title">VALORES</div>

        {pedido.total_produtos && (
          <div className="info-row">
            <span className="info-label">PRODUTOS:</span>
            <span className="info-value">{formatCurrency(pedido.total_produtos)}</span>
          </div>
        )}

        {pedido.taxa_entrega && (
          <div className="info-row">
            <span className="info-label">ENTREGA:</span>
            <span className="info-value">{formatCurrency(pedido.taxa_entrega)}</span>
          </div>
        )}

        {pedido.desconto && (
          <div className="info-row">
            <span className="info-label">DESCONTO:</span>
            <span className="info-value">-{formatCurrency(pedido.desconto)}</span>
          </div>
        )}

        <div className="total-section">
          <div className="total-row">
            <span className="total-label">TOTAL:</span>
            <span className="total-value">{formatCurrency(pedido.valor)}</span>
          </div>
        </div>

        <div className="section-divider"></div>
        <div className="section-title">DADOS DO CLIENTE</div>

        <div className="info-row">
          <span className="info-label">WHATSAPP:</span>
          <span className="info-value">{formatPhone(pedido.whatsapp)}</span>
        </div>

        <div className="info-row">
          <span className="info-label">ENDEREÇO:</span>
          <span className="info-value" style={{ fontSize: '26px' }}>{formatAddress(pedido)}</span>
        </div>

        {pedido.codigo_rastreamento && (
          <>
            <div className="section-divider"></div>
            <div className="section-title">ENTREGA</div>
            <div className="info-row">
              <span className="info-label">RASTREAMENTO:</span>
              <span className="info-value">{pedido.codigo_rastreamento.toUpperCase()}</span>
            </div>
          </>
        )}

        {pedido.observacoes && (
          <>
            <div className="section-divider"></div>
            <div className="section-title">OBSERVAÇÕES</div>
            <div className="description-box">
              {pedido.observacoes.toUpperCase()}
            </div>
          </>
        )}

        <div className="receipt-footer">
          <div className="footer-title">OBRIGADO PELA PREFERÊNCIA!</div>
          <div className="footer-text">WWW.ATENDOS.COM.BR</div>
          <div className="footer-text">ATENDIMENTO 24H COM IA</div>
          <div className="footer-phone">(35) 98707-9368</div>
        </div>
      </div>
    </>
  );
};

export default OrderReceiptTemplate;
