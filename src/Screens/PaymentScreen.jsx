import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

/**
 * PaymentScreen
 * Handles payment method selection and order confirmation.
 * Features:
 * - Shows total amount and payment options (currently only Cash on Delivery)
 * - Displays payment form/info based on selected method
 * - Handles payment process and shows loader
 * - Confirms order and saves to Firebase after payment
 * - Shows confirmation and error modals
 */
const PaymentScreen = ({ navigation, route }) => {
  // State for payment method selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  // Card details (not used for COD)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  // UPI and phone (not used for COD)
  const [upiId, setUpiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Loader for payment process
  const [isProcessing, setIsProcessing] = useState(false);
  // Modal for order confirmation
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  // Loader for saving order
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  // Modal for unsupported payment alert
  const [paymentAlertVisible, setPaymentAlertVisible] = useState(false);

  // Order/cart details from navigation params
  const { totalItems, totalPrice, itemIds, quantities, username, address } = route.params;

  // Payment methods (currently only COD enabled)
  const paymentMethods = [
    {
      id: 'cod',
      title: 'Cash on Delivery',
      icon: 'cash-outline',
      description: 'Pay when you receive',
      color: '#ea580c',
    },
  ];

  // If user not logged in, show error and exit
  if (!username) {
    Alert.alert('Error', 'User not logged in');
    setIsSavingOrder(false);
    return;
  }
  const userId = username.uid;

  /**
   * Handle payment button press
   * - If not COD, show alert (only COD supported)
   * - If COD, show loader and then confirmation modal
   */
  const handlePayment = () => {
    if (selectedPaymentMethod !== 'cod') {
      setPaymentAlertVisible(true);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setConfirmationVisible(true);
    }, 2000);
  };

  /**
   * Confirm and save order to Firebase
   * - Saves each cart item as an order for the user
   * - Navigates to MainTabs after success
   */
  const confirmOrder = async () => {
    setIsSavingOrder(true);

    try {
      const savePromises = itemIds.map(async (itemId) => {
        // Fetch food details from Firebase
        const foodRes = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods/${itemId}.json`);
        const foodData = foodRes.data;

        const quantity = quantities[itemId] || 1;
        const totalAmountForItem = foodData.price * quantity;

        const orderData = {
          itemId: itemId,
          name: foodData.name || '',
          description: foodData.description || '',
          image: foodData.image || '',
          price: foodData.price || 0,
          quantity: quantity,                        // actual quantity
          paymentMethod: selectedPaymentMethod,
          orderTime: new Date().toISOString(),
          status: 'placed',
          deliveryTime: '30 mins',
          address: address,
          totalAmount: totalAmountForItem,           // quantity based total
        };

        return axios.post(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/orders.json`,
          orderData
        );
      });

      await Promise.all(savePromises);

      setIsSavingOrder(false);
      setConfirmationVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { orderId: itemIds, username } }],
      });


    } catch (err) {
      setIsSavingOrder(false);
      Alert.alert('Error', 'Failed to save order. Try again later.');
    }
  };

  /**
   * Render a payment method card
   */
  const renderPaymentMethodCard = (method) => {
    const isSelected = selectedPaymentMethod === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.paymentMethodCard, isSelected && styles.selectedPaymentMethod]}
        onPress={() => setSelectedPaymentMethod(method.id)}
      >
        <LinearGradient
          colors={isSelected ? [method.color, method.color + '80'] : ['#f8fafc', '#f1f5f9']}
          style={styles.paymentMethodGradient}
        >
          <View style={styles.paymentMethodContent}>
            <View style={[styles.paymentIconContainer, { backgroundColor: method.color + '20' }]}>
              <Icon name={method.icon} size={24} color={method.color} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, isSelected && styles.selectedText]}>
                {method.title}
              </Text>
              <Text style={[styles.paymentMethodDescription, isSelected && styles.selectedText]}>
                {method.description}
              </Text>
            </View>
            <View style={[styles.radioButton, isSelected && styles.selectedRadio]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  /**
   * Render payment form/info based on selected method
   */
  const renderPaymentForm = () => {
    switch (selectedPaymentMethod) {
      case 'cod':
        return (
          <View style={styles.paymentForm}>
            <Text style={styles.formTitle}>Cash on Delivery</Text>

            <View style={styles.codInfo}>
              <Icon name="cash-outline" size={48} color="#ea580c" />
              <Text style={styles.codTitle}>Pay when you receive</Text>
              <Text style={styles.codDescription}>
                You can pay with cash when your order is delivered.
                Please keep the exact amount ready.
              </Text>
            </View>

            <View style={styles.codBenefits}>
              <View style={styles.benefitItem}>
                <Icon name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.benefitText}>No online payment required</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.benefitText}>Pay only after receiving</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.benefitText}>100% secure</Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Main UI render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header with back button and title */}
      <LinearGradient
        colors={['#1e293b', '#334155']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Main content: amount, payment methods, and form */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total amount card */}
        <View style={styles.amountCard}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.amountGradient}
          >
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{totalPrice.toFixed(2)}</Text>
            <Text style={styles.amountDescription}>
              {totalItems} items in your order
            </Text>
          </LinearGradient>
        </View>

        {/* Payment method selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          {paymentMethods.map(renderPaymentMethodCard)}
        </View>

        {/* Payment form/info */}
        <View style={styles.section}>
          {renderPaymentForm()}
        </View>

        {/* Security info */}
        <View style={styles.securityInfo}>
          <Icon name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Footer with pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.payButtonGradient}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Icon name="card-outline" size={20} color="#fff" />
                <Text style={styles.payButtonText}>₹{totalPrice.toFixed(2)}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal: Payment success and order confirmation */}
      <Modal
        visible={confirmationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            width: '80%',
            alignItems: 'center'
          }}>
            <Icon name="checkmark-circle" size={60} color="#22c55e" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Payment Successful</Text>
            <Text style={{ color: '#555', textAlign: 'center', marginTop: 8 }}>
              Do you want to confirm and place the order?
            </Text>

            {isSavingOrder ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity
                onPress={confirmOrder}
                style={{
                  marginTop: 20,
                  backgroundColor: '#6366f1',
                  paddingHorizontal: 30,
                  paddingVertical: 12,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Alert for unsupported payment methods */}
      <Modal
        visible={paymentAlertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentAlertVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Select Payment Method</Text>
            <Text style={{ color: '#555', textAlign: 'center', marginTop: 8 }}>
              Currently only Cash on Delivery is supported.
            </Text>

            <TouchableOpacity
              onPress={() => setPaymentAlertVisible(false)}
              style={{
                marginTop: 20,
                backgroundColor: '#6366f1',
                paddingHorizontal: 30,
                paddingVertical: 12,
                borderRadius: 12
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Loader while processing payment */}
      <Modal
        visible={isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loaderText}>Processing your payment...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 30,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  amountCard: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  amountGradient: {
    padding: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 8,
  },
  amountDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  paymentMethodCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPaymentMethod: {
    elevation: 8,
    shadowOpacity: 0.2,
  },
  paymentMethodGradient: {
    padding: 16,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedText: {
    color: '#fff',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#fff',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  paymentForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
  },
  upiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  upiInfoText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  walletOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  walletOption: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minWidth: 80,
  },
  walletOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  codInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  codTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  codDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  codBenefits: {
    marginTop: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 100,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    elevation: 10,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

});

export default PaymentScreen; 