import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator ,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Calculate item width for 2-column grid
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 60) / 2;

/**
 * PopularRecipesScreen
 * Displays a grid of popular recipes (foods) fetched from Firebase.
 * Features:
 * - Fetches food data from Firebase
 * - Allows filtering by category (if title param is provided)
 * - Lets user add/remove items to/from cart and adjust quantity
 * - Shows modal on successful add to cart
 * - Navigates to ItemCard for details and to OrderScreen for cart
 */
const PopularRecipesScreen = ({ navigation, route }) => {
  // State for all recipes
  const [popularRecipes, setPopularRecipes] = useState([]);
  // Loading state for fetching recipes
  const [loading, setLoading] = useState(true);
  // Category title from navigation params (for filtering)
  const { title } = route.params || {};
  // Modal state for "Added to Cart" confirmation
  const [showModal, setShowModal] = useState(false);
  // State for item quantities in cart
  const [quantities, setQuantities] = useState({});
  // Username and address from params or storage
  const [username, setUsername] = useState(route.params?.username || '');
  const [address, setAddress] = useState(route.params?.address || '');
  // Modal message and last added item (not used in UI)
  const [modalMessage, setModalMessage] = useState('');
  const [lastAddedItemId, setLastAddedItemId] = useState(null);

  /**
   * Navigate to OrderScreen (cart)
   */
  const handleViewCart = () => {
    try {
      navigation.navigate('OrderScreen', {});
    } catch (error) {
      console.error("Order Now Failed:", error);
    }
  };

  /**
   * Add a food item to cart in Firebase
   * If already in cart, increase quantity
   * Shows modal on success
   */
  const handleAddToCart = async (item) => {
    try {
      const res = await axios.get(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart.json`
      );

      // Check if food already in cart
      const existingItemKey = res.data
        ? Object.keys(res.data).find(
            key => res.data[key].foodId === item.id
          )
        : null;

      if (existingItemKey) {
        // Food already in cart → Increase quantity
        const currentQty = res.data[existingItemKey].quantity || 1;
        await axios.patch(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart/${existingItemKey}.json`,
          {
            quantity: currentQty + 1,
          }
        );
      } else {
        // Food not in cart → Add it with quantity 1
        await axios.put(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart/${item.id}.json`,
          {
            foodId: item.id,
            quantity: 1,
          }
        );
      }

      setShowModal(true);
    } catch (error) {
      console.log('Error adding to cart:', error);
      alert('Failed to add item');
    }
  };

  /**
   * Load username and address from AsyncStorage
   */
  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');

      if (storedUsername) setUsername(storedUsername);
      if (storedAddress) setAddress(storedAddress);

      // Debug logs
      console.log("Username:", storedUsername);
      console.log("Address:", storedAddress);
    } catch (error) {
      console.error('Failed to load user data from storage', error);
    }
  };

  /**
   * Handle quantity change for a food item in cart
   * Updates Firebase and local state
   * If quantity is 0, removes item from cart
   */
  const handleQuantityChange = async (item, change) => {
    const currentQty = quantities[item.id] || 0;
    const newQty = Math.max(0, currentQty + change);

    try {
      if (newQty === 0) {
        await axios.delete(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart/${item.id}.json`
        );
      } else {
        await axios.put(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart/${item.id}.json`,
          {
            foodId: item.id,
            quantity: newQty,
          }
        );
      }

      setQuantities(prev => ({
        ...prev,
        [item.id]: newQty,
      }));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  /**
   * Fetch all popular recipes (foods) from Firebase on mount
   */
  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const res = await axios.get(
          'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods.json'
        );
        if (res.data) {
          const recipeArray = Object.keys(res.data).map(key => ({
            id: key,
            ...res.data[key],
          }));
          setPopularRecipes(recipeArray);
        }
      } catch (err) {
        console.error('Error fetching foods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, []);

  /**
   * Render a single recipe card in the grid
   */
  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      
    >
      {/* Food image and veg/non-veg dot */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.recipeImage}
        />
        <View style={styles.imageOverlay}>
          <View style={styles.vegDotContainer}>
            <View
              style={[
                styles.vegDot,
                { backgroundColor: item.isVeg ? '#4CAF50' : '#f44336' },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Food name, description, info, and add/quantity controls */}
      <View style={styles.cardContent}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.ratingRow}>
          {/* You can add rating stars here if needed */}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.iconRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#667eea" />
            <Text style={styles.infoText}>{item.preparationTime}m</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="fire"
              size={14}
              color="#ff6b6b"
            />
            <Text style={styles.infoText}>{item.spiceLevel}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceText}>₹{item.price}</Text>
          </View>
          {/* Show quantity controls if item is in cart, else show Add button */}
          {quantities[item.id] > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => handleQuantityChange(item, -1)}>
                <Ionicons name="remove-circle" size={24} color="#667eea" />
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 8, fontWeight: 'bold' }}>
                {quantities[item.id]}
              </Text>
              <TouchableOpacity onPress={() => handleQuantityChange(item, 1)}>
                <Ionicons name="add-circle" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => handleQuantityChange(item, 1)}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filter recipes by category if title is provided
const filteredRecipes = popularRecipes.filter(item => {
  const categoryFromItem = item.category?.toLowerCase().replace(/\s+/g, '').trim() || '';
  const titleParam = title?.toLowerCase().replace(/\s+/g, '').trim() || '';


  if (!titleParam) return true;
  return categoryFromItem === titleParam;
});


  // Main UI render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      {/* Header with back button and title */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerRow}>
          
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Popular Recipes</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Most loved dishes by our customers
        </Text>
      </LinearGradient>

      {/* Category title if filtering */}
      <View style={{ padding: 10 }}>
        {title?.trim() ? (
          <Text style={styles.categoryTitle}>{title}</Text>
        ) : null}
      </View>

      {/* Loader while fetching recipes */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loaderText}>Loading recipes...</Text>
        </View>
      ) : (
        // Recipes grid
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.recipeList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          )}
        />
      )}

      {/* View Cart button at bottom */}
      <View style={styles.viewCartWrapper}>
        <TouchableOpacity style={styles.viewCartButton} onPress={handleViewCart}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.viewCartGradient}>
            <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.viewCartText}>View Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal for "Added to Cart" confirmation */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
            <Text style={styles.modalTitle}>Added to Cart</Text>
            <TouchableOpacity style={styles.buttonContainer} onPress={() => setShowModal(false)}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PopularRecipesScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom:32,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#667eea',
  textAlign: 'center',
  marginVertical: 10,
  textTransform: 'capitalize',
},
loaderContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
  backgroundColor: '#f8f9fa',
},

loaderText: {
  marginTop: 10,
  fontSize: 16,
  color: '#667eea',
  fontWeight: '500',
},

  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
  },
  buttonContainer: {
    width: '60%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  headerTitle: {
    fontSize: 20,
    marginRight:100,
    fontWeight: 'bold',
    color: '#fff',
  },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 25 },

  headerSubtitle: {
    fontSize: 13,
    color: '#e4e6eb',
    marginTop: 8,

    alignSelf: 'center'
  },
  recipeList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#2d3436',
  },
  modalButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    width: itemWidth,
    overflow: 'hidden',
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vegDotContainer: {
    padding: 2,
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 10,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#2d3436',
    marginLeft: 5,
  },
  description: {
    fontSize: 12,
    color: '#636e72',
    marginVertical: 6,
  },
  iconRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  infoText: {
    fontSize: 10,
    marginLeft: 4,
    color: '#636e72',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  prepTime: {
    fontSize: 10,
    color: '#636e72',
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 20,
    height:35,
    width:80,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 250,
},
emptyText: {
  fontSize: 16,
  color: '#999',
  marginTop: 10,
  textAlign: 'center',
  fontWeight: '500',
},
emptyImage: {
  width: 150,
  height: 150,
  tintColor: '#ccc',
},
viewCartWrapper: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  zIndex: 10,
},

viewCartButton: {
  borderRadius: 30,
  overflow: 'hidden',
},

viewCartGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderRadius: 30,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 5,
},

viewCartText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},


});
