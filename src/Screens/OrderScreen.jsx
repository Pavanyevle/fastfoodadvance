import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Chat from './Chat'

/**
 * EmptyCartIllustration
 * Shows an illustration and message when the cart is empty.
 */
const EmptyCartIllustration = ({ onBrowsePress }) => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  }}>
    <Ionicons name="cart-outline" size={80} color="#667eea" />
    <Text style={{
      fontSize: 20,
      color: '#1e293b',
      fontWeight: '600',
      textAlign: 'center',
    }}>
      Your cart is empty!
    </Text>
    <Text style={{
      fontSize: 14,
      color: '#64748b',
      marginTop: 6,
      textAlign: 'center',
    }}>
      Add delicious food items to get started.
    </Text>

    <TouchableOpacity
      onPress={onBrowsePress}
      style={{
        marginTop: 25,
        backgroundColor: '#667eea',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 25,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
      }}
    >
      <Text style={{
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      }}>
        Browse Items
      </Text>
    </TouchableOpacity>
  </View>
);


/**
 * OrderScreen
 * Displays the user's cart, allows editing quantities, removing items, and placing an order.
 * Features:
 * - Fetches cart items from Firebase
 * - Allows quantity adjustment and item removal
 * - Shows delivery address and summary
 * - Handles order placement and navigation to payment
 * - Shows loading and confirmation modals
 */
const OrderScreen = ({ navigation, route }) => {
  // State for delivery address selection
  const [deliveryAddress, setDeliveryAddress] = useState('Home');
  // State for estimated delivery time
  const [deliveryTime, setDeliveryTime] = useState('30-35 min');
  // State for cart items
  const [cartItems, setCartItems] = useState([]);
  // Loading state for cart fetch
  const [loading, setLoading] = useState(true);
  // Modal state for confirming item deletion
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  // Item id to delete
  const [itemToDelete, setItemToDelete] = useState(null);
  // Deleting loader state
  const [deleting, setDeleting] = useState(false);
  // Animation for place order button
  const [scaleAnim] = useState(new Animated.Value(1));
  // Food id from route params
  const { id } = route.params;
  // Username and address state
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  // Loader for placing order
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Firebase DB URL
  const FIREBASE_DB_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com';

  /**
   * Fetch quantity for a specific food item in cart
   */
  const fetchQuantity = async () => {
    try {
      const res = await axios.get(`${FIREBASE_DB_URL}/users/${username}/cart.json`);
      if (res.data) {
        const itemKey = Object.keys(res.data).find(
          key => res.data[key].foodId === id
        );
        if (itemKey) {
          const quantity = res.data[itemKey].quantity;
          setQuantity(quantity);
        }
      }
    } catch (error) {
      console.error("Error fetching quantity:", error);
    }
  };

  /**
   * Fetch username and address from AsyncStorage
   */
  const fetchUserInfo = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');
      if (storedUsername) setUsername(storedUsername);
      if (storedAddress) setAddress(storedAddress);
    } catch (error) {
      console.error("❌ Error fetching from AsyncStorage", error);
    }
  };

  const fetchUserAddress = async (user) => {
  try {
    const res = await axios.get(`${FIREBASE_DB_URL}/users/${user}.json`);
    if (res.data && res.data.location) {
      const { latitude, longitude } = res.data.location;
      const addressFromLocation = await reverseGeocodeFromLatLng(latitude, longitude);
      setAddress(addressFromLocation); // Set to screen
    } else if (res.data && res.data.address) {
      setAddress(res.data.address);
    }
  } catch (err) {
    console.error('Error fetching user address or location:', err);
  }
};


  /**
   * Update quantity for a cart item in Firebase and local state
   */
  const updateQuantity = async (newQty) => {
    try {
      const res = await axios.get(`${FIREBASE_DB_URL}/users/${username}/cart.json`);
      if (res.data) {
        const itemKey = Object.keys(res.data).find(
          key => res.data[key].foodId === id
        );
        if (itemKey) {
          await axios.patch(`${FIREBASE_DB_URL}/users/${username}/cart/${itemKey}.json`, {
            quantity: newQty,
          });
          setQuantity(newQty);
        }
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchCartItems = async (user) => {
        try {
          const res = await axios.get(`${FIREBASE_DB_URL}/users/${user}/cart.json`);
          if (res.data) {
            const foodEntries = Object.entries(res.data);
            const foodDetailsPromises = foodEntries.map(async ([key, value]) => {
              const foodId = value.foodId;
              const quantity = value.quantity || 1;
              const foodRes = await axios.get(`${FIREBASE_DB_URL}/foods/${foodId}.json`);
              const price = parseInt(foodRes.data.price);
              return {
                ...foodRes.data,
                id: foodId,
                price,
                quantity,
                total: `₹${price * quantity}`,
              };
            });
            const foodDetails = await Promise.all(foodDetailsPromises);
            setCartItems(foodDetails.reverse());
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.error("Error refreshing cart items:", error);
        }
      };

      if (username) {
        fetchCartItems(username);
      }
    }, [username]) // 👈 username बदलला तरही fetch होईल
  );


  useEffect(() => {
  if (username) {
    fetchUserAddress(username); // ✅ username change झाला की चालेल
  }
}, [username]);

  /**
   * Fetch cart items, quantity, and address on mount
   */
  useEffect(() => {
    const fetchCartItems = async (user) => {
      try {
        const res = await axios.get(`${FIREBASE_DB_URL}/users/${user}/cart.json`);
        if (res.data) {
          const foodEntries = Object.entries(res.data);
          const foodDetailsPromises = foodEntries.map(async ([key, value]) => {
            const foodId = value.foodId;
            const quantity = value.quantity || 1;
            const foodRes = await axios.get(`${FIREBASE_DB_URL}/foods/${foodId}.json`);
            const price = parseInt(foodRes.data.price);
            return {
              ...foodRes.data,
              id: foodId,
              price,
              quantity,
              total: `₹${price * quantity}`,
            };
          });
          const foodDetails = await Promise.all(foodDetailsPromises);
          setCartItems(foodDetails.reverse()); // 🔁 latest item first
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    const fetchQuantity = async (user) => {
      try {
        const res = await axios.get(`${FIREBASE_DB_URL}/users/${user}/cart.json`);
        if (res.data) {
          const itemKey = Object.keys(res.data).find(
            key => res.data[key].foodId === id
          );
          if (itemKey) {
            const quantity = res.data[itemKey].quantity;
            setQuantity(quantity);
          }
        }
      } catch (error) {
        console.error("Error fetching quantity:", error);
      }
    };

    const fetchUserAddress = async (user) => {
      try {
        const res = await axios.get(`${FIREBASE_DB_URL}/users/${user}.json`);
        if (res.data && res.data.address) {
          setAddress(res.data.address);
        }
      } catch (err) {
        console.error('Error fetching user address:', err);
      }
    };

    const fetchData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');

        if (storedUsername) {
          setUsername(storedUsername);
          await fetchCartItems(storedUsername);
          await fetchQuantity(storedUsername);
          await fetchUserAddress(storedUsername);
          await fetchUserAddress(storedUsername);
        }
        if (storedAddress) {
          setAddress(storedAddress);
        }
      } catch (err) {
        console.error("❌ Error fetching data from AsyncStorage:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Handle deleting an item from cart (shows confirmation modal)
   */
  const handleDeleteItem = async (itemId) => {
    setDeleting(true);
    try {
      const res = await axios.get(`${FIREBASE_DB_URL}/users/${username}/cart.json`);
      if (res.data) {
        const keyToDelete = Object.keys(res.data).find(
          key => res.data[key].foodId === itemId
        );
        if (keyToDelete) {
          await axios.delete(`${FIREBASE_DB_URL}/users/${username}/cart/${keyToDelete}.json`);
          setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
        } else {
          console.warn("Item key not found in cart.");
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  /**
   * Show confirmation modal for deleting an item
   */
  const confirmDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setDeleteModalVisible(true);
  };


  const reverseGeocodeFromLatLng = async (lat, lon) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
 const fullAddress = res.data.display_name; // ✅ येथे मिळाला full address
    console.log("📍 Address from coordinates:", fullAddress);

    // हवे असल्यास अजून वापरासाठी इथे वापरू शकतो
    return fullAddress;  } catch (error) {
    console.error("❌ Reverse geocoding failed:", error);
    return "Unknown Location";
  }
};

  /**
   * Handle quantity change for a cart item (updates local and Firebase)
   */
  const handleQuantityChange = async (itemId, change) => {
    let updatedCartItems = [...cartItems];
    const index = updatedCartItems.findIndex(item => item.id === itemId);

    if (index !== -1) {
      const currentItem = updatedCartItems[index];
      const newQuantity = currentItem.quantity + change;

      // ✅ UI ला लगेच update करा (Optimistic Update)
      if (newQuantity <= 0) {
        updatedCartItems.splice(index, 1);
      } else {
        updatedCartItems[index] = {
          ...currentItem,
          quantity: newQuantity,
          total: `₹${newQuantity * currentItem.price}`,
        };
      }

      setCartItems(updatedCartItems); // ✅ First update UI

      try {
        // ✅ Then update Firebase (Backend)
        const res = await axios.get(`${FIREBASE_DB_URL}/users/${username}/cart.json`);
        if (res.data) {
          const key = Object.keys(res.data).find(k => res.data[k].foodId === itemId);

          if (key) {
            if (newQuantity <= 0) {
              await axios.delete(`${FIREBASE_DB_URL}/users/${username}/cart/${key}.json`);
            } else {
              await axios.patch(`${FIREBASE_DB_URL}/users/${username}/cart/${key}.json`, {
                quantity: newQuantity,
              });
            }
          }
        }
      } catch (err) {
        console.error("❌ Firebase update error:", err);
        // Optional: तू error झाल्यावर पुन्हा UI rollback करू शकतोस
      }
    }
  };


  // Delivery address options (currently only Home)
  const deliveryAddresses = [
    { id: '1', name: 'Home', address: address, selected: true },
  ];

  // Calculate order summary values
  const subtotal = cartItems.reduce((sum, item) => sum + parseInt(item.total.replace('₹', '')), 0);
  const deliveryFee = 30;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  /**
   * Render a single cart item row
   */
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemBorder} />
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity style={styles.removeBtn} onPress={() => confirmDeleteItem(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => handleQuantityChange(item.id, -1)}>
              <Ionicons name="remove" size={16} color="#667eea" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>
              {item.quantity > 0 ? item.quantity : 0}
            </Text>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => handleQuantityChange(item.id, 1)}>
              <Ionicons name="add" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>{item.price}</Text>
        </View>
      </View>

    </View>
  );

  /**
   * Handle placing the order
   * Shows loader, animates button, and navigates to PaymentScreen
   */
  const handlePlaceOrder = () => {
    setIsPlacingOrder(true); // Show loader

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const itemIds = cartItems.map(item => item.id);
      const quantities = {};
      cartItems.forEach(item => {
        quantities[item.id] = item.quantity;
      });

      // Simulate API delay before navigating to payment
      setTimeout(() => {
        setIsPlacingOrder(false);
        navigation.navigate('PaymentScreen', {
          totalItems: cartItems.length,
          totalPrice: total,
          itemIds: itemIds,
          quantities: quantities,
          username: username,
          address: address,
        });
      }, 1000);
    });
  };

  // Main UI render
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#667eea" barStyle="light-content" />
        {/* Header with back button and title */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Your Cart</Text>
              <Text style={styles.headerSubtitle}>Review and place your order</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Loader while fetching cart */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={{ marginTop: 10, fontSize: 16, color: '#667eea' }}>
              Loading your cart...
            </Text>
          </View>
        ) : cartItems.length === 0 ? (
  <EmptyCartIllustration onBrowsePress={() => navigation.navigate('PopularRecipesScreen', { username, address })} />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cart Items Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cart Items</Text>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.cartList}
              />
            </View>

            {/* Add More Items Button */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#667eea',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 4,
                }}
                onPress={() => navigation.navigate('PopularRecipesScreen', { username: username, address: address })}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  + Add More Items
                </Text>
              </TouchableOpacity>
            </View>
            4

            {/* Delivery Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {deliveryAddresses.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.deliveryAddress, deliveryAddress === item.name && styles.selectedAddress]}
                  onPress={() => setDeliveryAddress(item.name)}
                >
                  <View style={styles.addressContent}>
                    <View style={styles.addressHeader}>
                      <Ionicons name="location" size={20} color="#667eea" />
                      <Text style={styles.addressName}>{item.name}</Text>
                    </View>
                    <Text style={styles.addressText}>{item.address}</Text>
                  </View>
                  {deliveryAddress === item.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{subtotal}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (5%)</Text>
                  <Text style={styles.summaryValue}>₹{tax}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{total}</Text>
                </View>
              </View>
            </View>

            {/* Delivery Info and Place Order Button Section */}
            <View style={styles.section}>
              <View style={styles.deliveryInfoCard}>
                <View style={styles.deliveryInfoRow}>
                  <Ionicons name="time-outline" size={20} color="#667eea" />
                  <Text style={styles.deliveryInfoText}>Estimated Delivery: {deliveryTime}</Text>
                </View>
                <View style={styles.deliveryInfoRow}>
                  <Ionicons name="location-outline" size={20} color="#667eea" />
                  <Text style={styles.deliveryInfoText}>Delivery to: {deliveryAddress}</Text>
                </View>
              </View>
              <View style={styles.section}>
                <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} activeOpacity={0.8}>
                  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.placeOrderGradient}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.placeOrderText}>Place Order - ₹{total}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom container for animation (currently empty) */}
        <View style={styles.bottomContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }} />
        </View>

        {/* Modal for confirming item deletion */}
        <Modal visible={deleteModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Remove Item?</Text>
              {deleting ? (
                <ActivityIndicator size="large" color="#667eea" />
              ) : (
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => handleDeleteItem(itemToDelete)}
                  >
                    <Text style={styles.modalBtnText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => setDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>No</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Loader modal while placing order */}
        {isPlacingOrder && (
          <Modal transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={{ marginTop: 15, fontSize: 16, color: '#667eea' }}>
                  Placing your order...
                </Text>
              </View>
            </View>
          </Modal>
        )}

      </SafeAreaView>
      <Chat />
    </View>
  );
};

export default OrderScreen;

// Styles for OrderScreen UI components


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cartBtn: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  cartList: {
    paddingHorizontal: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  cartItemBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    backgroundColor: '#667eea',
    zIndex: 1,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    zIndex: 2,
  },
  itemContent: {
    flex: 1,
    zIndex: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    flex: 1,
  },
  removeBtn: {
    padding: 5,
  },
  itemDescription: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 10,
    lineHeight: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginHorizontal: 10,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  addressList: {
    paddingHorizontal: 20,
  },
  deliveryAddress: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedAddress: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#636e72',
    marginLeft: 28,
  },
  paymentList: {
    paddingHorizontal: 20,
  },
  paymentMethod: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPayment: {
    backgroundColor: '#667eea',
  },
  paymentText: {
    fontSize: 16,
    color: '#2d3436',
    marginLeft: 12,
    fontWeight: '500',
  },
  selectedPaymentText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#636e72',
  },
  summaryValue: {
    fontSize: 16,
    color: '#2d3436',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  deliveryInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryInfoText: {
    fontSize: 14,
    color: '#636e72',
    marginLeft: 10,
  },
  bottomContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  placeOrderBtn: {
    borderRadius: 15,
    overflow: 'hidden',
    margin: 20,
    marginBottom: 5,

    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginVertical: 20,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
