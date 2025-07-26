import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';

/**
 * Steps for order status tracker
 * Each step has a label and an icon
 */
const orderSteps = [
  { label: 'Placed', icon: 'cart-outline' },
  { label: 'Confirmed', icon: 'check-circle-outline' },
  { label: 'Preparing', icon: 'chef-hat' },
  { label: 'Out for Delivery', icon: 'bike' },
  { label: 'Delivered', icon: 'home-outline' },
];

/**
 * OrderStatusScreen
 * Shows the current status of a user's order with a visual tracker.
 * Features:
 * - Polls Firebase for live order status and delivery time
 * - Displays order summary, status tracker, estimated delivery, and address
 */
const OrderStatusScreen = ({ navigation, route }) => {
  // Get order, orderId, username, and address from navigation params
  const { order, orderId, username, address } = route.params;

  /**
   * Get the index of the current step based on order status
   */
  const getStepIndex = (status) => {
    const steps = {
      placed: 0,
      confirmed: 1,
      processing: 2,
      out_for_delivery: 3,
      delivered: 4,
    };
    return steps[status?.toLowerCase()] ?? -1;
  };

  // State for current order status and step index
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [currentStep, setCurrentStep] = useState(getStepIndex(order.status));
  // State for estimated delivery time
  const [deliveryTime, setDeliveryTime] = useState("30 mins");

  /**
   * Poll for order status and delivery time updates every second
   * Updates UI if status or delivery time changes
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Fetch updated status from Firebase
        const statusRes = await axios.get(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/orders/${order.id}/status.json`
        );
        const updatedStatus = statusRes.data;

        // Fetch updated delivery time from Firebase
        const timeRes = await axios.get(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/orders/${order.id}/deliveryTime.json`
        );
        const updatedTime = timeRes.data;

        // Update status and step if changed
        if (updatedStatus !== currentStatus) {
          setCurrentStatus(updatedStatus);
          setCurrentStep(getStepIndex(updatedStatus));
        }

        // Update delivery time if changed
        if (updatedTime && updatedTime !== deliveryTime) {
          setDeliveryTime(updatedTime);
        }
      } catch (e) {
        console.log('Polling failed:', e.message);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Main UI render
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header with back button and title */}
      <LinearGradient colors={['#1e293b', '#334155']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Status</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Welcome message with username */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Hello, {username}</Text>
      </View>

      {/* Main content scrollable area */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Order summary card */}
        <View style={styles.card}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>{order.orderTime}</Text>
          <View style={styles.itemsRow}>
            <Text style={styles.itemText}>{order.quantity}x {order.name}</Text>
          </View>
        </View>

        {/* Status tracker visual component */}
        <View style={styles.statusContainer}>
          {orderSteps.map((step, idx) => (
            <View key={step.label} style={styles.stepContainer}>
              <View
                style={[
                  styles.iconCircle,
                  idx <= currentStep ? styles.activeCircle : styles.inactiveCircle,
                ]}
              >
                <Icon
                  name={step.icon}
                  size={24}
                  color={idx <= currentStep ? '#fff' : '#b0b0b0'}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  idx <= currentStep ? styles.activeLabel : styles.inactiveLabel,
                ]}
              >
                {step.label}
              </Text>
              {/* Connecting line between steps */}
              {idx < orderSteps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    idx < currentStep ? styles.activeLine : styles.inactiveLine,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Estimated delivery time or status */}
        <View style={styles.card}>
          <Text style={styles.estimateTitle}>Estimated Delivery</Text>
          {typeof currentStatus === 'string' && currentStatus.toLowerCase() === 'cancelled' ? (
            <Text style={[styles.estimateTime, { color: '#dc2626' }]}>❌ Cancelled</Text>
          ) : currentStatus?.toLowerCase() === 'delivered' ? (
            <Text style={[styles.estimateTime, { color: '#16a34a' }]}>✅ Order Completed</Text>
          ) : (
            <Text style={styles.estimateTime}>{deliveryTime}</Text>
          )}
        </View>

        {/* Delivery address card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.address}</Text>
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  headerRight: {
    width: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#1e293b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  orderDate: {
    color: '#888',
    marginTop: 4,
    fontSize: 13,
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  itemText: {
    color: '#444',
    fontSize: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeCircle: {
    backgroundColor: '#ff7e36',
  },
  inactiveCircle: {
    backgroundColor: '#e0e0e0',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: 70,
    marginTop: 4,
    lineHeight: 16,
  },
  activeLabel: {
    color: '#ff7e36',
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: '#b0b0b0',
  },
  line: {
    position: 'absolute',
    top: 19,
    left: '100%',
    width: 32,
    height: 4,
    borderRadius: 2,
    zIndex: -1,
  },
  activeLine: {
    backgroundColor: '#ff7e36',
  },
  inactiveLine: {
    backgroundColor: '#e0e0e0',
  },
  estimateTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  estimateTime: {
    color: '#ff7e36',
    fontWeight: 'bold',
    fontSize: 22,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  addressText: {
    color: '#444',
    fontSize: 15,
  },
});

export default OrderStatusScreen;
