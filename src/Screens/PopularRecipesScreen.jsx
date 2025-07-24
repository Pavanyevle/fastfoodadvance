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
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 60) / 2;

const PopularRecipesScreen = ({ navigation, route }) => {
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { username, address } = route.params || {};
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const handleAddToCart = async (item) => {
    try {
      const cartItem = { foodId: item.id };
      await axios.post(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/cart.json`,
        cartItem
      );
      setShowModal(true);
    } catch (error) {
      console.log('Error adding to cart:', error);
      alert('Failed to add item');
    }
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods.json'
        );
        const data = res.data;

        if (data) {
          const list = Object.keys(data).map(id => ({
            id,
            ...data[id],
          }));
          setPopularRecipes(list);
        } else {
          setPopularRecipes([]);
        }
      } catch (err) {
        console.log('❌ Failed to fetch food:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() =>
        navigation.navigate('ItemCard', {
          id: item.id,
          username: username,
          address: address,
        })
      }
    >
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
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.iconRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#667eea" />
            <Text style={styles.infoText}>{item.deliveryTime}m</Text>
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
            <Text style={styles.prepTime}>{item.preparationTime}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Popular Recipes</Text>
          <Ionicons name="search" size={24} color="#fff" />
        </View>
        <Text style={styles.headerSubtitle}>
          Most loved dishes by our customers
        </Text>
      </LinearGradient>

      <FlatList
        data={popularRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.recipeList}
      />
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
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
});
