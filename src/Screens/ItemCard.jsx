import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';

// Get device width for responsive design
const { width } = Dimensions.get('window');
// Firebase Realtime Database URL
const FIREBASE_DB_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com';

/**
 * FoodDetailScreen
 * Displays detailed information about a food item.
 * Allows user to adjust quantity, add to cart, and proceed to order.
 */
const FoodDetailScreen = ({ navigation, route }) => {
  // Get food id, username, and address from navigation params
  const { id, username, address } = route.params;

  // State for food details
  const [food, setFood] = useState(null);
  // State for selected quantity
  const [quantity, setQuantity] = useState(1);
  // Loading state for fetching food data
  const [loading, setLoading] = useState(true);
  // Modal state for "Added to Cart" confirmation
  const [showModal, setShowModal] = useState(false);

  /**
   * Handle "Order Now" button press
   * Navigates to OrderScreen with selected food and quantity
   */
  const handleOrderNow = async () => {
    try {
      navigation.navigate('OrderScreen', {
        id,
        username,
        address,
        quantity,
        price: (parseInt(food.price) * quantity).toFixed(0),
      });
    } catch (error) {
      console.error("Order Now Failed:", error);
    }
  };

  /**
   * Add current food item to user's cart in Firebase
   * If already in cart, update quantity; else, create new cart item
   */
  const addToCart = async () => {
    try {
      const res = await axios.get(`${FIREBASE_DB_URL}/users/${username}/cart/${id}.json`);

      if (res.data) {
        // If item already in cart, update quantity
        await axios.patch(`${FIREBASE_DB_URL}/users/${username}/cart/${id}.json`, {
          quantity: quantity,
        });
      } else {
        // If new item, create with foodId and quantity
        await axios.put(`${FIREBASE_DB_URL}/users/${username}/cart/${id}.json`, {
          foodId: id,
          quantity: quantity,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setShowModal(false);
    }
  };

  /**
   * Fetch food details from Firebase on mount
   */
  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await axios.get(`${FIREBASE_DB_URL}/foods/${id}.json`);
        if (res.data) setFood(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  // Increment quantity
  const increment = () => setQuantity(prev => prev + 1);
  // Decrement quantity (min 1)
  const decrement = () => quantity > 1 && setQuantity(prev => prev - 1);

  // Show loader while fetching food data
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // Show message if food not found
  if (!food) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ fontSize: 18, color: '#333' }}>No food found.</Text>
      </View>
    );
  }

  // Main UI render
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable content with food image and details */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Food image with overlay */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: food.image }} style={styles.foodImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
        </View>

        {/* Food details section */}
        <View style={styles.content}>
          <Text style={styles.foodTitle}>{food.name}</Text>
          <Text style={styles.foodSubtitle}>{food.description}</Text>

          {/* Nutrition info */}
          <View style={styles.nutritionContainer}>
            {['Fatsc', 'Carbs', 'Protein'].map((label, idx) => (
              <View key={idx} style={styles.nutrientBox}>
                <Text style={styles.nutrientLabel}>{label}</Text>
                <Text style={styles.nutrientValue}>{food[label.toLowerCase()]}g</Text>
              </View>
            ))}
          </View>

          {/* Delivery time */}
          <View style={styles.deliveryContainer}>
            <Text style={styles.deliveryLabel}>Delivery Time:</Text>
            <Text style={styles.deliveryTime}>{food.preparationTime} mins</Text>
          </View>

          {/* Quantity selector and price */}
          <View style={styles.priceQuantityRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={decrement} style={styles.qtyBtn}>
                <Ionicons name="remove" size={20} color="#667eea" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity onPress={increment} style={styles.qtyBtn}>
                <Ionicons name="add" size={20} color="#667eea" />
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₹{(parseInt(food.price) * quantity).toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons: Add to Cart & View Cart */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonContainer} onPress={() => setShowModal(true)}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonContainer} onPress={handleOrderNow}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>View Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal for "Added to Cart" confirmation */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
            <Text style={styles.modalTitle}>Added to Cart</Text>
            <TouchableOpacity style={styles.buttonContainer} onPress={addToCart}>
              <LinearGradient colors={["#667eea", "#764ba2"]} style={{
                paddingVertical: 12,
                borderRadius: 10,
                width: 70,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={styles.buttonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#3c4b5aff'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    borderRadius: 25
  },
  scrollContainer: {
   
  },
  imageContainer: {
    height: 350,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 20,
    elevation: 10,
    flex: 1,
    minHeight: 600,
  },
  foodTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d3436'
  },
  foodSubtitle: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 5,
    marginBottom: 15
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  nutrientBox: {
    alignItems: 'center',
    flex: 1,
  },
  nutrientLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  nutrientValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  deliveryContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginRight: 5,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  qtyBtn: {
    padding: 5
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#2d3436'
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 16,
    color: '#636e72'
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea'
  },
  buttonRow: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 15,
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonGradient: {
    paddingVertical: 12,
    borderRadius: 10,

    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    backgroundColor: '#fff',
    height: 200,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 5,
    marginBottom: 5,
  },
});

export default FoodDetailScreen;
