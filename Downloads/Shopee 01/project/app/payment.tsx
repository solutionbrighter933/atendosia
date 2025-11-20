import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Clipboard, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { ArrowLeft, CheckCircle, Info, CreditCard as CreditCardIcon, ShieldCheck } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Payment() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const productPrice = parseFloat(params.productPrice as string || '19.87');
  const productName = params.productName as string || 'Suplemento Alimentar Gummy Hair';
  const productFlavor = params.productFlavor as string || 'Morango';
  const paymentMethod = params.paymentMethod as string || 'pix';
  const paymentId = params.paymentId as string;
  const qrCode = params.qrCode as string;
  const expiresAt = params.expiresAt as string;
  const clientSecret = params.clientSecret as string;
  const paymentIntentId = params.paymentIntentId as string;
  const orderId = params.orderId as string;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (!expiresAt || paymentMethod === 'creditCard') return;

    const calculateTimeRemaining = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((expiry - now) / 1000);
      return diff > 0 ? diff : 0;
    };

    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        setPaymentStatus('expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, paymentMethod]);

  useEffect(() => {
    if (!paymentId || paymentStatus !== 'pending' || paymentMethod === 'creditCard') return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`https://pixgo.org/api/v1/payment/${paymentId}/status`, {
          headers: {
            'X-API-Key': 'pk_87dc1972a0f23094361111a1b4f59e5325b1d66127bf66f7a322846e613b837d'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.status === 'completed') {
            setPaymentStatus('completed');
            await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('payment_id', paymentId);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    const statusInterval = setInterval(checkPaymentStatus, 5000);
    checkPaymentStatus();

    return () => clearInterval(statusInterval);
  }, [paymentId, paymentStatus, paymentMethod]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')} minutos ${String(secs).padStart(2, '0')} segundos`;
  };

  const formatExpiryDate = () => {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `Vence em ${day} ${month} ${year}, ${hours}:${mins}`;
  };

  const formatCardNumber = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const chunks = numbers.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : '';
  };

  const formatExpiry = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const handleCopyPixCode = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(qrCode);
      } else {
        Clipboard.setString(qrCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleCreditCardPayment = async () => {
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      alert('Por favor, preencha todos os campos do cartão');
      return;
    }

    setProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      setPaymentStatus('completed');
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      alert(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(`https://pixgo.org/api/v1/payment/${paymentId}/status`, {
        headers: {
          'X-API-Key': 'pk_87dc1972a0f23094361111a1b4f59e5325b1d66127bf66f7a322846e613b837d'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.data.status === 'completed') {
            setPaymentStatus(data.data.status);
            await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('payment_id', paymentId);
          } else {
            setShowVerificationModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setShowVerificationModal(true);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (paymentStatus === 'completed') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.successGradient}
        >
          <View style={styles.successHeader}>
            <TouchableOpacity style={styles.backButtonSuccess} onPress={() => router.push('/')}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.successContent}>
            <View style={styles.successIconCircle}>
              <CheckCircle color="#4CAF50" size={64} strokeWidth={2.5} />
            </View>

            <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
            <Text style={styles.successMessage}>
              Seu pagamento foi aprovado com sucesso e seu pedido está sendo processado.
            </Text>

            <View style={styles.successDetailsCard}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Pedido</Text>
                <Text style={styles.successDetailValue}>{productName}</Text>
              </View>
              <View style={styles.successDetailDivider} />
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Valor Pago</Text>
                <Text style={styles.successDetailValuePrice}>R$ {productPrice.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.successButtonText}>Voltar para Início</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#EE4D2D" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pagamento</Text>
        </View>
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredTitle}>Pagamento Expirado</Text>
          <Text style={styles.expiredMessage}>
            Este código PIX expirou. Por favor, faça um novo pedido.
          </Text>
          <TouchableOpacity
            style={styles.okButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.okButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#EE4D2D" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {paymentMethod === 'creditCard' ? (
          <>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Pagamento Total</Text>
              <Text style={styles.totalValue}>R${productPrice.toFixed(2).replace('.', ',')}</Text>
            </View>

            <View style={styles.pixSection}>
              <View style={styles.pixHeader}>
                <CreditCardIcon color="#EE4D2D" size={36} />
                <Text style={styles.pixTitle}>Cartão de Crédito</Text>
              </View>

              <View style={styles.securityNotice}>
                <ShieldCheck color="#4CAF50" size={18} />
                <Text style={styles.securityText}>
                  Pagamento seguro processado pelo <Text style={styles.shopeePayText}>ShopeePay</Text>
                </Text>
              </View>

              <View style={styles.codeSection}>
                <View style={styles.cardForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Número do Cartão</Text>
                    <TextInput
                      style={styles.cardInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      maxLength={19}
                      value={cardData.number}
                      onChangeText={(text) => {
                        const formatted = formatCardNumber(text);
                        setCardData({ ...cardData, number: formatted });
                      }}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome no Cartão</Text>
                    <TextInput
                      style={styles.cardInput}
                      placeholder="NOME COMPLETO"
                      placeholderTextColor="#999"
                      autoCapitalize="characters"
                      value={cardData.name}
                      onChangeText={(text) => setCardData({ ...cardData, name: text.toUpperCase() })}
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Validade</Text>
                      <TextInput
                        style={styles.cardInput}
                        placeholder="MM/AA"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={5}
                        value={cardData.expiry}
                        onChangeText={(text) => {
                          const formatted = formatExpiry(text);
                          setCardData({ ...cardData, expiry: formatted });
                        }}
                      />
                    </View>

                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        style={styles.cardInput}
                        placeholder="123"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        value={cardData.cvv}
                        onChangeText={(text) => setCardData({ ...cardData, cvv: text.replace(/\D/g, '') })}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Por favor siga as instruções</Text>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>1</Text>
                </View>
                <Text style={styles.instructionText}>Preencha os dados do seu cartão de crédito.</Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Verifique se todas as informações estão corretas.
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Clique no botão "Pagar Agora" para finalizar.
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  Seu pagamento será aprovado em alguns segundos.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Pagamento Total</Text>
              <Text style={styles.totalValue}>R${productPrice.toFixed(2).replace('.', ',')}</Text>
            </View>

            <View style={styles.timerSection}>
              <Text style={styles.timerLabel}>Pagar em até</Text>
              <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerExpiry}>{formatExpiryDate()}</Text>
            </View>

            <View style={styles.pixSection}>
              <View style={styles.pixHeader}>
                <Image
                  source={require('@/assets/images/20250919160711_logo-pix-icone-1024.png')}
                  style={styles.pixIcon}
                  resizeMode="contain"
                />
                <Text style={styles.pixTitle}>Pix</Text>
              </View>

              <View style={styles.securityNotice}>
                <ShieldCheck color="#4CAF50" size={18} />
                <Text style={styles.securityText}>
                  Pagamento seguro processado pelo <Text style={styles.shopeePayText}>ShopeePay</Text>
                </Text>
              </View>

              <View style={styles.codeSection}>
                <Text style={styles.codeTitle}>Código Pix</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText} numberOfLines={1} ellipsizeMode="middle">
                    {qrCode}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.copyButton, copied && styles.copiedButton]}
                  onPress={handleCopyPixCode}
                >
                  <Text style={[styles.copyButtonText, copied && styles.copiedButtonText]}>
                    {copied ? 'Código Copiado!' : 'Copiar Código Pix'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Por favor siga as instruções</Text>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>1</Text>
                </View>
                <Text style={styles.instructionText}>Copie o código Pix acima.</Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Acesse o app do seu banco ou internet banking de preferência.
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Escolha pagar com o Pix, cole o código e finalize o pagamento.
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  Seu pagamento será aprovado em alguns segundos.
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.okButton}
          onPress={paymentMethod === 'creditCard' ? handleCreditCardPayment : handleCheckStatus}
          disabled={checkingStatus || processingPayment}
        >
          {(checkingStatus || processingPayment) ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.okButtonText}>{paymentMethod === 'creditCard' ? 'Pagar Agora' : 'OK'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Info color="#FF9800" size={48} />
            </View>
            <Text style={styles.modalTitle}>Pagamento não identificado!</Text>
            <Text style={styles.modalMessage}>
              Verificamos e ainda não consta pagamento para este pedido, por favor, aguarde alguns instantes e tente novamente.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowVerificationModal(false)}
            >
              <Text style={styles.modalButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  totalSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  totalValue: {
    fontSize: 18,
    color: '#EE4D2D',
    fontWeight: '600',
  },
  timerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  timerLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    fontWeight: '400',
  },
  timerValue: {
    fontSize: 16,
    color: '#EE4D2D',
    fontWeight: '600',
    marginBottom: 6,
  },
  timerExpiry: {
    fontSize: 13,
    color: '#999',
  },
  pixSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  pixIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  pixTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '400',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0F9F4',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 8,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  shopeePayText: {
    fontWeight: '700',
    color: '#FF5733',
  },
  codeSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  codeTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '400',
  },
  codeBox: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    width: '100%',
  },
  codeText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EE4D2D',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  copiedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  copyButtonText: {
    color: '#EE4D2D',
    fontSize: 15,
    fontWeight: '500',
  },
  copiedButtonText: {
    color: '#FFFFFF',
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  instructionsTitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    fontWeight: '400',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'web' ? 10 : 24,
  },
  okButton: {
    backgroundColor: '#EE4D2D',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  expiredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
  },
  expiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successGradient: {
    flex: 1,
  },
  successHeader: {
    paddingTop: Platform.OS === 'web' ? 16 : 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButtonSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.95,
  },
  successDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  successDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  successDetailValuePrice: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  successButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: '#EE4D2D',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#EE4D2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  cardInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  cardRow: {
    flexDirection: 'row',
  },
});
