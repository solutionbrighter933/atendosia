import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { trackInitiateCheckout } from '@/lib/metaPixel';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const productName = params.productName as string || 'Suplemento Alimentar Gummy Hair';
  const productPrice = parseFloat(params.productPrice as string || '19.87');
  const productFlavor = params.productFlavor as string || 'Morango';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    cep: '',
    state: '',
    city: '',
    street: '',
    number: '',
    complement: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    trackInitiateCheckout(productName, productPrice);
  }, []);

  useEffect(() => {
    const isValid =
      formData.fullName.trim() !== '' &&
      formData.phone.replace(/\D/g, '').length >= 10 &&
      formData.email.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.cep.replace(/\D/g, '').length === 8 &&
      formData.state.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.street.trim() !== '' &&
      formData.number.trim() !== '';
    setIsFormValid(isValid);
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    } else if (formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP inválido';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Rua/Avenida é obrigatória';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''} - ${formData.city}/${formData.state} - CEP: ${formData.cep}`;

      router.push({
        pathname: '/order-confirmation',
        params: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: fullAddress,
          email: formData.email,
          cep: formData.cep,
          city: formData.city,
          state: formData.state,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          productName: productName,
          productPrice: productPrice.toString(),
          productFlavor: productFlavor
        }
      });
    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      if (Platform.OS === 'web') {
        alert(error.message || 'Erro ao processar pedido. Tente novamente.');
      } else {
        Alert.alert('Erro', error.message || 'Não foi possível processar seu pedido. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)} ${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)} ${numbers.slice(7, 11)}`;
  };

  const formatCEP = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#FF3D00" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Endereço</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Nome Completo"
              placeholderTextColor="#999"
              value={formData.fullName}
              onChangeText={(text) => {
                setFormData({ ...formData, fullName: text });
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="(+55) 35 98707 9368"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => {
                const formatted = formatPhone(text);
                setFormData({ ...formData, phone: formatted });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              maxLength={16}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.cep && styles.inputError]}
              placeholder="CEP"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={formData.cep}
              onChangeText={(text) => {
                const formatted = formatCEP(text);
                setFormData({ ...formData, cep: formatted });
                if (errors.cep) setErrors({ ...errors, cep: '' });
              }}
              maxLength={9}
            />
            {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, (errors.state || errors.city) && styles.inputError]}
              placeholder="Estado"
              placeholderTextColor="#999"
              value={formData.state}
              onChangeText={(text) => {
                setFormData({ ...formData, state: text });
                if (errors.state) setErrors({ ...errors, state: '' });
              }}
            />
            {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Cidade"
              placeholderTextColor="#999"
              value={formData.city}
              onChangeText={(text) => {
                setFormData({ ...formData, city: text });
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2 }]}>
              <TextInput
                style={[styles.input, errors.street && styles.inputError]}
                placeholder="Rua / Avenida"
                placeholderTextColor="#999"
                value={formData.street}
                onChangeText={(text) => {
                  setFormData({ ...formData, street: text });
                  if (errors.street) setErrors({ ...errors, street: '' });
                }}
              />
              {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={[styles.input, errors.number && styles.inputError]}
                placeholder="Número"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={formData.number}
                onChangeText={(text) => {
                  setFormData({ ...formData, number: text });
                  if (errors.number) setErrors({ ...errors, number: '' });
                }}
              />
              {errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Complemento/Referências Próx./Descrição do Prédio"
              placeholderTextColor="#999"
              value={formData.complement}
              onChangeText={(text) => setFormData({ ...formData, complement: text })}
              multiline
            />
          </View>
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produto:</Text>
            <Text style={styles.summaryValue}>{productName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sabor:</Text>
            <Text style={styles.summaryValue}>{productFlavor}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor:</Text>
            <Text style={styles.summaryPrice}>R$ {productPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isFormValid && styles.submitButtonActive, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.submitButtonText, isFormValid && styles.submitButtonTextActive]}>SUBMETER</Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
  section: {
    backgroundColor: '#F5F5F5',
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputContainer: {
    marginBottom: 1,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  inputError: {
    borderBottomColor: '#FF3D00',
    borderBottomWidth: 2,
  },
  errorText: {
    color: '#FF3D00',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#FFF3E0',
  },
  row: {
    flexDirection: 'row',
    gap: 1,
  },
  orderSummary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  summaryPrice: {
    fontSize: 16,
    color: '#FF3D00',
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#D0D0D0',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#FF3D00',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  submitButtonTextActive: {
    color: '#fff',
  },
});
