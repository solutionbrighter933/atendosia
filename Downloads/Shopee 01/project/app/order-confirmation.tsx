import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, MapPin, Package, Truck, CreditCard, Info } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { trackPurchase } from '@/lib/metaPixel';

export default function OrderConfirmation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('pix');
  const [showShippingModal, setShowShippingModal] = useState(false);

  const fullName = params.fullName as string || '';
  const phone = params.phone as string || '';
  const address = params.address as string || '';
  const email = params.email as string || '';
  const cep = params.cep as string || '';
  const city = params.city as string || '';
  const state = params.state as string || '';
  const street = params.street as string || '';
  const number = params.number as string || '';
  const complement = params.complement as string || '';
  const productName = params.productName as string || '';
  const baseProductPrice = parseFloat(params.productPrice as string || '19.87');
  const productFlavor = params.productFlavor as string || '';
  const shippingCost = 0;

  const productPrice = selectedPayment === 'pix' ? 19.87 : 48.13;
  const totalPrice = productPrice + shippingCost;

  const [processingOrder, setProcessingOrder] = useState(false);

  const getDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return deliveryDate.toLocaleDateString('pt-BR', options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <ArrowLeft color="#FF3D00" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Continuar</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.card} onPress={() => router.back()} activeOpacity={0.7}>
          <MapPin color="#EE4D2D" size={24} />
          <View style={styles.addressInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.addressName}>{fullName}</Text>
              <Text style={styles.phoneText}>{phone}</Text>
            </View>
            <Text style={styles.addressText}>{address}</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>

        <View style={styles.storeCard}>
          <View style={styles.storeHeader}>
            <View style={styles.storeIndicator}>
              <Text style={styles.storeIndicatorText}>Indicado</Text>
            </View>
            <Text style={styles.storeName}>Droga Clara</Text>
          </View>

          <View style={styles.productRow}>
            <Image
              source={
                productFlavor === 'Morango' ? require('@/assets/images/morango.png') :
                productFlavor === 'Melancia' ? require('@/assets/images/melancia.png') :
                require('@/assets/images/macaverde.png')
              }
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {productName}
              </Text>
              <Text style={styles.productFlavor}>Sabor: {productFlavor}</Text>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.productPrice}>R${productPrice.toFixed(2)}</Text>
                  {selectedPayment === 'creditCard' && (
                    <Text style={styles.priceNote}>42% OFF no cartão</Text>
                  )}
                  {selectedPayment === 'pix' && (
                    <Text style={styles.priceNote}>76% OFF no Pix</Text>
                  )}
                </View>
                <Text style={styles.productQuantity}>x1</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.shippingCard}>
          <View style={styles.shippingHeader}>
            <Text style={styles.shippingTitle}>Opção de Envio</Text>
            <TouchableOpacity onPress={() => setShowShippingModal(true)}>
              <Text style={styles.seeMoreText}>Ver Mais</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shippingOption}>
            <View style={styles.shippingBadge}>
              <View style={styles.checkmark} />
            </View>
            <View style={styles.shippingDetails}>
              <View style={styles.shippingRow}>
                <Text style={styles.shippingName}>Entrega Padrão</Text>
                <Text style={styles.shippingPriceFree}>Grátis</Text>
              </View>
              <View style={styles.deliveryInfo}>
                <Truck color="#28A745" size={16} />
                <Text style={styles.deliveryText}>Receba até {getDeliveryDate()}</Text>
              </View>
              <Text style={styles.deliverySubtext}>Entrega em até 7 dias úteis</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total de 1 itens</Text>
            <View style={styles.totalPriceContainer}>
              <Text style={styles.totalValue}>R${totalPrice.toFixed(2)}</Text>
              <Text style={styles.oldPriceSmall}>R$82,99</Text>
            </View>
          </View>
        </View>

        <View style={styles.couponCard}>
          <View style={styles.couponLeft}>
            <CreditCard color="#FF3D00" size={24} />
            <Text style={styles.couponTitle}>Cupom Shopee</Text>
          </View>
          <View style={styles.couponRight}>
            <View style={styles.couponAppliedContainer}>
              <Text style={styles.couponCode}>EMILLY10</Text>
              <Text style={styles.couponApplied}>Aplicado</Text>
            </View>
            <Text style={styles.couponArrow}>›</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentTitle}>Métodos de pagamento</Text>
          </View>
          <Text style={styles.paymentSubtitle}>Processado por <Text style={styles.shopeePayText}>ShopeePay</Text></Text>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment('pix')}
          >
            <View style={styles.pixIconContainer}>
              <Image
                source={require('@/assets/images/10.png')}
                style={styles.pixLogo}
                resizeMode="contain"
              />
              <Text style={styles.pixText}>Pix</Text>
            </View>
            <View style={[styles.radioButton, selectedPayment === 'pix' && styles.radioButtonSelected]}>
              {selectedPayment === 'pix' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment('creditCard')}
          >
            <View style={styles.pixIconContainer}>
              <CreditCard color="#333" size={24} />
              <Text style={styles.pixText}>Cartão de Crédito</Text>
            </View>
            <View style={[styles.radioButton, selectedPayment === 'creditCard' && styles.radioButtonSelected]}>
              {selectedPayment === 'creditCard' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.paymentDetailsCard}>
          <Text style={styles.paymentDetailsTitle}>Detalhes de Pagamento</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total dos Produtos</Text>
            <View>
              <Text style={styles.detailValue}>R${productPrice.toFixed(2)}</Text>
              <Text style={styles.detailOldPrice}>R$82,99</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total do Frete</Text>
            <Text style={styles.detailValueFree}>Grátis</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showShippingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShippingModal(false)}
      >
        <View style={styles.shippingModalOverlay}>
          <View style={styles.shippingModalContent}>
            <View style={styles.shippingModalIconContainer}>
              <Truck color="#28A745" size={48} />
            </View>
            <Text style={styles.shippingModalTitle}>Opção de Envio</Text>
            <Text style={styles.shippingModalMessage}>
              Esta é a única opção de envio disponível para este pedido.
            </Text>
            <TouchableOpacity
              style={styles.shippingModalButton}
              onPress={() => setShowShippingModal(false)}
            >
              <Text style={styles.shippingModalButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Métodos de pagamento</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Processado por <Text style={styles.shopeePayText}>ShopeePay</Text></Text>

            <TouchableOpacity
              style={styles.paymentOptionItem}
              onPress={() => {
                setSelectedPayment('pix');
                setShowPaymentModal(false);
              }}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={styles.pixIconBox}>
                  <Text style={styles.pixIconText}>Pix</Text>
                </View>
                <Text style={styles.paymentOptionText}>Pix</Text>
              </View>
              <View style={[styles.radioButton, selectedPayment === 'pix' && styles.radioButtonSelected]}>
                {selectedPayment === 'pix' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOptionItem, styles.paymentOptionDisabled]}
              disabled
            >
              <View style={styles.paymentOptionLeft}>
                <View style={styles.creditCardIconBox}>
                  <CreditCard size={16} color="#999" />
                </View>
                <View>
                  <Text style={styles.paymentOptionTextDisabled}>Cartão de Crédito</Text>
                  <Text style={styles.paymentOptionSubtext}>Indisponível</Text>
                </View>
              </View>
              <View style={styles.radioButton} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOptionItem, styles.paymentOptionDisabled]}
              disabled
            >
              <View style={styles.paymentOptionLeft}>
                <View style={styles.boletoIconBox}>
                  <Text style={styles.boletoIconText}>≡</Text>
                </View>
                <View>
                  <Text style={styles.paymentOptionTextDisabled}>Boleto</Text>
                  <Text style={styles.paymentOptionSubtext}>Indisponível</Text>
                </View>
              </View>
              <View style={styles.radioButton} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTotalLabel}>Total <Text style={styles.footerTotalAmount}>R${totalPrice.toFixed(2)}</Text></Text>
            <Text style={styles.footerSavings}>Economizou R${selectedPayment === 'pix' ? (82.99 - 19.87).toFixed(2) : (82.99 - 48.13).toFixed(2)} com {selectedPayment === 'pix' ? '76' : '42'}% OFF</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderButton, processingOrder && styles.orderButtonDisabled]}
            onPress={async () => {
              if (processingOrder) return;

              setProcessingOrder(true);
              try {
                const fullAddressFormatted = `${street}, ${number}${complement ? ', ' + complement : ''}, ${city}, ${state}, ${cep}`;

                const { data: addressData, error: addressError } = await supabase
                  .from('addresses')
                  .insert({
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    address: address,
                    cep: cep,
                    city: city,
                    state: state,
                    street: street,
                    number: number,
                    complement: complement
                  })
                  .select()
                  .maybeSingle();

                if (addressError) throw addressError;

                if (selectedPayment === 'creditCard') {
                  const paymentIntentResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      amount: productPrice,
                      currency: 'brl',
                      description: `${productName} - ${productFlavor}`,
                      customer_email: email,
                      customer_name: fullName
                    })
                  });

                  if (!paymentIntentResponse.ok) {
                    const errorData = await paymentIntentResponse.json();
                    throw new Error(errorData.error || 'Erro ao criar pagamento');
                  }

                  const paymentData = await paymentIntentResponse.json();

                  const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                      address_id: addressData.id,
                      product_name: productName,
                      product_price: productPrice,
                      product_flavor: productFlavor,
                      quantity: 1,
                      total_price: productPrice,
                      status: 'pending',
                      payment_id: paymentData.paymentIntentId
                    })
                    .select()
                    .maybeSingle();

                  if (orderError) throw orderError;

                  trackPurchase(productPrice, orderData.id);

                  router.push({
                    pathname: '/payment',
                    params: {
                      productName: productName,
                      productPrice: productPrice.toString(),
                      productFlavor: productFlavor,
                      paymentMethod: 'creditCard',
                      clientSecret: paymentData.clientSecret,
                      paymentIntentId: paymentData.paymentIntentId,
                      orderId: orderData.id
                    }
                  });
                } else {
                  const pixResponse = await fetch('https://pixgo.org/api/v1/payment/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-API-Key': 'pk_87dc1972a0f23094361111a1b4f59e5325b1d66127bf66f7a322846e613b837d'
                    },
                    body: JSON.stringify({
                      amount: productPrice,
                      description: `${productName} - ${productFlavor}`,
                      customer_name: fullName,
                      customer_email: email,
                      customer_phone: phone,
                      customer_address: fullAddressFormatted,
                      external_id: `order_${Date.now()}`
                    })
                  });

                  if (!pixResponse.ok) {
                    const errorData = await pixResponse.json();
                    throw new Error(errorData.message || 'Erro ao criar pagamento PIX');
                  }

                  const pixData = await pixResponse.json();

                  if (!pixData.success) {
                    throw new Error(pixData.message || 'Erro ao criar pagamento PIX');
                  }

                  const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                      address_id: addressData.id,
                      product_name: productName,
                      product_price: productPrice,
                      product_flavor: productFlavor,
                      quantity: 1,
                      total_price: productPrice,
                      status: 'pending',
                      payment_id: pixData.data.payment_id
                    })
                    .select()
                    .maybeSingle();

                  if (orderError) throw orderError;

                  trackPurchase(productPrice, orderData.id);

                  router.push({
                    pathname: '/payment',
                    params: {
                      productName: productName,
                      productPrice: productPrice.toString(),
                      productFlavor: productFlavor,
                      paymentMethod: 'pix',
                      paymentId: pixData.data.payment_id,
                      qrCode: pixData.data.qr_code,
                      qrImageUrl: pixData.data.qr_image_url,
                      expiresAt: pixData.data.expires_at
                    }
                  });
                }
              } catch (error: any) {
                console.error('Erro ao criar pedido:', error);
                if (Platform.OS === 'web') {
                  alert(error.message || 'Erro ao processar pedido. Tente novamente.');
                } else {
                  Alert.alert('Erro', error.message || 'Não foi possível processar seu pedido. Tente novamente.');
                }
                setProcessingOrder(false);
              }
            }}
          >
            {processingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.orderButtonText}>Fazer pedido</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
  },
  addressInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  phoneText: {
    fontSize: 15,
    color: '#8B8B8B',
    fontWeight: '400',
  },
  addressText: {
    fontSize: 15,
    color: '#8B8B8B',
    lineHeight: 22,
  },
  arrowIcon: {
    fontSize: 28,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  storeCard: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  storeIndicator: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#FFE0E0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  productFlavor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3D00',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  priceNote: {
    fontSize: 11,
    color: '#FF3D00',
    fontWeight: '500',
    marginTop: 2,
  },
  totalPriceContainer: {
    alignItems: 'flex-end',
  },
  oldPriceSmall: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  detailOldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    textAlign: 'right',
    marginTop: 2,
  },
  shippingCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  shippingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shippingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#666',
  },
  shippingOption: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#28A745',
  },
  shippingBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkmark: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  shippingDetails: {
    flex: 1,
  },
  shippingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shippingName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  shippingPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  shippingPriceFree: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28A745',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deliveryText: {
    fontSize: 13,
    color: '#28A745',
    fontWeight: '500',
  },
  deliverySubtext: {
    fontSize: 12,
    color: '#666',
  },
  totalCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3D00',
  },
  couponCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  couponRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponAppliedContainer: {
    alignItems: 'flex-end',
  },
  couponCode: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  couponApplied: {
    fontSize: 11,
    color: '#00A854',
    marginTop: 2,
  },
  couponPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  couponArrow: {
    fontSize: 24,
    color: '#999',
  },
  paymentCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentArrow: {
    fontSize: 24,
    color: '#999',
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  shopeePayText: {
    color: '#FF3D00',
    fontWeight: 'bold',
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pixIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pixLogo: {
    width: 24,
    height: 24,
  },
  pixText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF3D00',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3D00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#666',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  paymentOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pixIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pixIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boletoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boletoIconText: {
    fontSize: 20,
    color: '#999',
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  paymentOptionTextDisabled: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  paymentOptionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  paymentDetailsCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  detailValueFree: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 180,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3D00',
  },
  footerSavings: {
    fontSize: 12,
    color: '#FF3D00',
  },
  orderButton: {
    backgroundColor: '#E8623C',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 4,
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shippingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shippingModalContent: {
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
  shippingModalIconContainer: {
    marginBottom: 20,
  },
  shippingModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  shippingModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  shippingModalButton: {
    backgroundColor: '#28A745',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shippingModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
