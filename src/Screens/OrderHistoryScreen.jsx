import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

/**
 * OrderHistoryScreen
 * Shows a list of all orders placed by the user.
 * Features:
 * - Fetches order history from Firebase
 * - Displays order details and status
 * - Allows user to cancel pending/processing orders
 * - Shows order details in a modal
 * - Allows user to track order status
 * - Polls for order updates every 4 seconds
 */
const OrderHistoryScreen = ({ navigation, route }) => {
  // Get username from navigation params
  const { username } = route.params;
  // State for all orders
  const [orders, setOrders] = useState([]);
  // Loading state for fetching orders
  const [loading, setLoading] = useState(true);
  // State for currently selected order (for modal)
  const [selectedOrder, setSelectedOrder] = useState(null);
  // State for showing cancel confirmation modal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // State for order id to cancel
  const [cancelOrderId, setCancelOrderId] = useState(null);

  /**
   * Get color for order status badge
   */
  const getStatusColor = (s) =>
    ({
      delivered: '#059669',
      pending: '#ea580c',
      processing: '#3b82f6',
      cancelled: '#dc2626',
    }[s] || '#64748b');

  /**
   * Cancel an order by updating its status in Firebase
   * Updates local state after successful cancellation
   */
  const cancelOrder = async (orderId) => {
    try {
      await axios.patch(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/orders/${orderId}.json`,
        { status: 'cancelled' }
      );

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      }

      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  /**
   * Poll for order updates every 4 seconds
   * Fetches latest orders from Firebase and updates state
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/orders.json`
        );

        if (res.data) {
          const arr = Object.entries(res.data).map(([id, o]) => ({
            id,
            ...o,
          }));
          setOrders(arr.sort((a, b) => b.orderTime - a.orderTime));
        } else {
          setOrders([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Polling error:', err.message);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Render a single order card in the list
   */
  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedOrder(item)}>
      <LinearGradient colors={['#fff', '#f8fafc']} style={styles.cardInner}>
        {/* Order ID and payment method */}
        <View style={styles.row}>
          <Text style={styles.orderId}>Order ID: {item.id}</Text>
          <Text style={[styles.method, { color: getStatusColor(item.status) }]}>
            {item.paymentMethod?.toUpperCase()}
          </Text>
        </View>

        {/* Food image, name, description, and status badge */}
        <View style={styles.rowCenter}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/60' }}
            style={styles.thumbnail}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}>
            <Icon
              name={
                item.status === 'delivered'
                  ? 'checkmark-circle'
                  : item.status === 'pending'
                  ? 'time'
                  : item.status === 'cancelled'
                  ? 'close-circle'
                  : 'time'
              }
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}> 
              {item.status}
            </Text>
          </View>
        </View>

        {/* Amount and order date */}
        <View style={styles.row}>
          <Text style={styles.amount}>₹{item.totalAmount || item.price}</Text>
          <Text style={styles.date}>{new Date(item.orderTime).toLocaleDateString()}</Text>
        </View>

        {/* Cancel button for eligible orders */}
        {item.status !== 'cancelled' && item.status !== 'delivered' && (
          <TouchableOpacity
            onPress={() => {
              setCancelOrderId(item.id);
              setShowCancelConfirm(true);
            }}
            style={styles.inlineCancelBtn}>
            <Text style={{ color: '#fff' }}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  // Main UI render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header with back button and title */}
      <LinearGradient colors={['#1e293b', '#334155']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Order</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Orders list */}
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={renderOrder}
      />

      {/* Confirm Cancel Modal */}
      <Modal visible={showCancelConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.modalTitle}>Are you sure you want to cancel this order?</Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setShowCancelConfirm(false)}
                style={[styles.cancelBtn, { backgroundColor: '#64748b' }]}
              >
                <Text style={{ color: '#fff' }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => cancelOrder(cancelOrderId)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: '#fff' }}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <ScrollView>
              {/* Food image and details */}
              <Image
                source={{ uri: selectedOrder.image || 'https://via.placeholder.com/100' }}
                style={{
                  width: '95%',
                  height: 180,
                  margin: 10,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#e0e7ff',
                }}
              />
              <Text style={{ fontWeight: 'bold' }}>{selectedOrder.name}</Text>
              <Text style={{ fontStyle: 'italic', color: '#555' }}>{selectedOrder.description}</Text>
              <Text>Price: ₹{selectedOrder.price}</Text>
              <Text>Payment: {selectedOrder.paymentMethod}</Text>
              <Text
                style={{
                  color:
                    selectedOrder.status?.toLowerCase() === 'cancelled'
                      ? '#dc2626'
                      : '#000',
                }}>
                Status: {selectedOrder.status}
              </Text>
              <Text>Quantity: {selectedOrder.quantity}</Text>
              <Text>Total Amount: ₹{selectedOrder.totalAmount}</Text>
              <Text>Date: {new Date(selectedOrder.orderTime).toLocaleString()}</Text>
              <Text style={{ marginTop: 4 }}>Address: {selectedOrder.address}</Text>
            </ScrollView>

            {/* Close button for modal */}
            <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>

            {/* Track order button */}
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => {
                navigation.navigate('OrderStatusScreen', {
                  order: selectedOrder,
                  username,
                  address: selectedOrder.address,
                });
                setSelectedOrder(null);
              }}>
              <Text style={{ color: '#fff' }}>Track Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loader modal while fetching orders */}
      {loading && (
        <Modal visible transparent animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loaderText}>Loading your orders...</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// Styles for OrderHistoryScreen UI components
const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  cardInner: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
  },
  method: {
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '85%',
  },
  confirmBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: 100,
  },
  trackBtn: {
    marginTop: 10,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inlineCancelBtn: {
    marginTop: 10,
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;