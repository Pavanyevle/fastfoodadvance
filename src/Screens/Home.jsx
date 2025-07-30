import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  PermissionsAndroid
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Chat from './Chat'
import Swiper from 'react-native-swiper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

// Get device width for responsive UI
const { width } = Dimensions.get('window');

// Firebase Realtime Database URL
const FIREBASE_DB_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/';

/**
 * Home Screen
 * Main dashboard for the user after login.
 * Features:
 * - Shows greeting, user info, address, and notifications
 * - Displays food categories, popular recipes, latest offers, and promos
 * - Handles live location updates and address reverse geocoding
 * - Fetches data from Firebase and updates UI on focus
 */
const Home = ({ navigation, route }) => {
  // State variables
  const [foods, setFoods] = useState([]); // All food items
  const [loading, setLoading] = useState(true); // Loader state
  const [greeting, setGreeting] = useState(''); // Greeting message
  const [username, setUsername] = useState(''); // Current user
  const [address, setAddress] = useState(''); // User address
  const [latestOffers, setLatestOffers] = useState([]); // Latest offers
  const [profileImage, setProfileImage] = useState(null); // Profile image
  const [selectedImage, setSelectedImage] = useState(null); // Selected profile image
  const [profileData, setProfileData] = useState({}); // Full profile data
  const isFocused = useIsFocused(); // Navigation focus state
  const [notificationCount, setNotificationCount] = useState(0); // Unread notifications
  const [promos, setPromos] = useState([]); // Promo banners

  // Ref for geolocation watch
  const watchIdRef = useRef(null);

  /**
   * Fetch promo banners from Firebase
   */
  const fetchPromos = async () => {
    try {
      const res = await axios.get(`${FIREBASE_DB_URL}/promos.json`);
      const data = res.data;
      if (data) {
        const promoArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPromos(promoArray);
      }
    } catch (err) {
      console.log('❌ Error fetching promos:', err.message);
    }
  };

  /**
   * Fetch unread notification count from DB
   */
  const fetchNotificationCount = async () => {
    try {
      const res = await axios.get(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/notifications.json`
      );
      const data = res.data;
      if (data) {
        const unread = Object.values(data).filter(n => n.isRead === false);
        setNotificationCount(unread.length);
      } else {
        setNotificationCount(0);
      }
    } catch (err) {
      console.error('❌ Error fetching notification count from DB:', err);
      setNotificationCount(0);
    }
  };

  /**
   * Fetch all foods from Firebase
   */
  const fetchFoods = async () => {
    try {
      const response = await axios.get(`${FIREBASE_DB_URL}/foods.json`);
      const data = response.data;
      if (data) {
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setFoods(formattedData);
      } else {
        setFoods([]);
      }
    } catch (error) {
      console.log('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user data (username, address, profile image, etc.)
   */
  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');

      if (storedUsername) {
        setUsername(storedUsername);

        // Fetch profile image and other user data
        const userRes = await axios.get(`${FIREBASE_DB_URL}/users/${storedUsername}.json`);
        const userData = userRes.data;

        if (userData) {
          setProfileImage(userData.image || null); // image for header
          setProfileData(userData); // full data for use (e.g. email, image, etc.)
        }
      }

      if (storedAddress) setAddress(storedAddress);
    } catch (e) {
      console.log('❌ Error loading user data:', e);
    }
  };

  /**
   * Request location permission and watch live location for address updates
   */
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for deliveries.',
            buttonPositive: 'Allow',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Start watching location
          watchIdRef.current = Geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                // Reverse geocode using Nominatim
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                  params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                  },
                  headers: {
                    'User-Agent': 'ReactNativeApp/1.0 (pavanyevle6@gmail.com)',
                    'Accept-Language': 'en',
                  },
                });

                const resolvedAddress = response.data?.display_name || 'Unknown Address';
                setAddress(resolvedAddress);

                const storedUsername = await AsyncStorage.getItem('username');
                if (storedUsername) {
                  await axios.patch(`${FIREBASE_DB_URL}/users/${storedUsername}.json`, {
                    address: resolvedAddress,
                    latitude: latitude,
                    longitude: longitude
                  });
                }

                await AsyncStorage.setItem('address', resolvedAddress);
              } catch (error) {
                console.log('❌ Reverse geocoding error:', error.message);
              }
            },
            (error) => {
              console.log('❌ Location error:', error.message);
            },
            {
              enableHighAccuracy: true,
              distanceFilter: 5,
              interval: 10000,
              fastestInterval: 5000,
              forceRequestLocation: true,
              showLocationDialog: true,
            }
          );
        } else {
          console.log('❌ Location permission denied');
        }
      } catch (err) {
        console.log('❌ Location permission error:', err);
      }
    };

    requestLocationPermission();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Static food categories for horizontal scroll
  const foodItems = [
    { id: '1', name: 'Burger', image: require('../img/burger.jpeg'), icon: 'hamburger' },
    { id: '2', name: 'Pizza', image: require('../img/pizza.jpg'), icon: 'pizza' },
    { id: '3', name: 'Salad', image: require('../img/salad.jpg'), icon: 'food-apple' },
    { id: '4', name: 'Chicken', image: require('../img/chiken.jpg'), icon: 'food-drumstick' },
    { id: '5', name: 'Desserts', image: require('../img/dosa.jpg'), icon: 'cake-variant' },
    { id: '6', name: 'Drinks', image: require('../img/burger.jpeg'), icon: 'cup-water' },
  ];

  /**
   * Render a single food category item
   */
  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => navigation.navigate('PopularRecipesScreen', { title: item.name, username: username, address: address })}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.foodItemGradient}
      >
        <MaterialCommunityIcons name={item.icon} size={30} color="#fff" />
      </LinearGradient>
      <Text style={styles.foodName}>{item.name}</Text>
    </TouchableOpacity>
  );

  /**
   * Render a single popular recipe card
   */
  const renderPopularRecipe = ({ item }) => (
    <TouchableOpacity
      style={styles.popularCard}
      onPress={() =>
        navigation.navigate('ItemCard', {
          id: item.id,
          username: username,
          address: address,
        })
      }
    >
      <View style={styles.imageWrapper}>
        {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={12} color="#667eea" />
            <Text style={styles.deliveryText}>{item.deliveryTime}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render a single latest offer card
   */
  const renderLatestOffer = ({ item }) => (
    <TouchableOpacity style={styles.offerCard}>
      <Image source={{ uri: item.image }} style={styles.offerImage} />
      <View style={styles.offerBadge}>
        <Text style={styles.offerText}>{item.offer}</Text>
      </View>
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{item.name}</Text>
        <Text style={styles.offerDesc}>{item.description}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          <Text style={styles.discountedPrice}>{item.discountedPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Fetch latest offers and merge with food data
   */
  const fetchLatestOffers = async () => {
    try {
      const offerRes = await axios.get(`${FIREBASE_DB_URL}/offers.json`);
      const offerData = offerRes.data;

      if (offerData) {
        const offersArray = Object.keys(offerData).map(key => ({
          id: key,
          ...offerData[key],
        }));

        // Merge offer with food details
        const combinedData = await Promise.all(
          offersArray.map(async offer => {
            const foodRes = await axios.get(`${FIREBASE_DB_URL}/foods/${offer.foodId}.json`);
            const foodData = foodRes.data;

            return {
              id: offer.id,
              name: foodData.name,
              description: foodData.description || '',
              image: foodData.image,
              originalPrice: `₹${foodData.price}`,
              discountedPrice: `₹${offer.offer}`,
              offer: `₹${parseInt(foodData.price) - parseInt(offer.offer)} OFF`,
            };
          })
        );

        setLatestOffers(combinedData);
      }
    } catch (err) {
      console.log('❌ Error fetching latest offers:', err.message);
    }
  };

  /**
   * Main effect: set greeting, load user/foods/offers/notifications/promos on focus
   */
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning !');
    else if (hour < 18) setGreeting('Good Afternoon !');
    else setGreeting('Good Evening !');

    if (isFocused) {
      loadUserData();
      fetchFoods();
      fetchLatestOffers();
      fetchNotificationCount();
      fetchPromos();
    }
  }, [isFocused]);

  // Main UI render
  return (
    <View style={styles.container}>

      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Loader Modal while loading */}
      {loading && (
        <Modal visible transparent animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loaderText}>Loading your dashboard...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Main content when not loading */}
      {!loading && (
        <>
          {/* Header with profile, greeting, address, notifications */}
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.userSection}>
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={() =>
                    navigation.navigate('Profile', { username, address })
                  }
                >
                  <Image
                    source={
                      selectedImage
                        ? { uri: selectedImage }
                        : profileData.image
                          ? { uri: profileData.image }
                          : require('../img/profile.png')
                    }
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                  <Text style={styles.greeting}>{greeting}</Text>
                  <View style={{ width: 100, height: 25, overflow: 'hidden', alignSelf: 'center' }}>
                    <Text style={styles.username}>{username}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                <View style={styles.fixedWrapper}>
                  <TouchableOpacity style={styles.locationBtn}>
                    <EvilIcons name="location" size={20} color="#fff" />
                    <Text
                      style={styles.locationText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {address || 'Fetching address...'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.notificationBtn}
                  onPress={() =>
                    navigation.navigate('NotificationScreen', { username, address })
                  }
                >
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                  {notificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Main Scrollable Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchSection}>
              <TouchableOpacity
                style={styles.searchContainer}
                onPress={() =>
                  navigation.navigate('SearchScreen', { username, address })
                }
              >
                <Feather name="search" size={20} color="#667eea" />
                <Text style={styles.searchPlaceholder}>Search foods...</Text>
              </TouchableOpacity>
            </View>

            {/* Promo Swiper */}
            <View style={styles.sliderContainer}>
              <Swiper
                autoplay
                autoplayTimeout={2}
                showsPagination={true}
                dotColor="rgba(255,255,255,0.5)"
                activeDotColor="#fff"
                paginationStyle={styles.pagination}
              >
                {promos.map((item, index) => (
                  <View key={index} style={styles.slideContainer}>
                    <LinearGradient colors={item.bgColor} style={styles.promoCard}>
                      <View style={styles.promoContent}>
                        <View style={styles.promoTextContainer}>
                          <Text style={styles.promoTitle}>{item.title1}</Text>
                          <Text style={styles.promoSubtitle}>{item.title2}</Text>
                          <Text style={styles.promoDesc}>{item.subtitle}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </Swiper>
            </View>

            {/* Food Categories Horizontal List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Food Categories</Text>
              </View>
              <FlatList
                horizontal
                data={foodItems}
                renderItem={renderFoodItem}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Popular Recipes Horizontal List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Recipes</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('PopularRecipesScreen', { username, address })
                  }
                >
                  <Text style={styles.seeMore}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={foods}
                renderItem={renderPopularRecipe}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recipesList}
              />
            </View>
            {/* Latest Offers Horizontal List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest Offers</Text>
              </View>
              <FlatList
                horizontal
                data={latestOffers}
                renderItem={renderLatestOffer}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.offersList}
              />
            </View>
          </ScrollView>
        </>
        
      )}
        <Chat  />

    </View>
  );
};

export default Home;

// ...styles remain unchanged...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingRight: 20
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageWrapper: {
    height: 150,
    margin: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e0e7ff',
  },
  image: { width: '100%', height: '100%', borderRadius: 16 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fixedWrapper: {
    width: 135, // 
    overflow: 'hidden',
    alignSelf: 'center',
  },

  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    width: '100%',
  },

  locationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 3,
    flexShrink: 1,
  },
  notificationBtn: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 6,
  },
  notificationBadge: {
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  sliderContainer: {
    height: 150,
    marginBottom: 20,
  },
  slideContainer: {
    paddingHorizontal: 20,

  },
  promoCard: {
    borderRadius: 20,
    height: 150,
    overflow: 'hidden',

  },
  promoContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  promoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  promoSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  promoDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',

  },
  orderBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  orderText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
  },
  promoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  pagination: {
    bottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  seeMore: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  foodItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  foodItemGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 12,
    color: '#2d3436',
    fontWeight: '600',
    textAlign: 'center',
  },
  recipesList: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  popularCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#2d3436',
    marginLeft: 3,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 10,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 11,
    color: '#667eea',
    marginLeft: 3,
  },
  offersList: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  offerCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  offerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  offerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerContent: {
    padding: 15,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 5,
  },
  offerDesc: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 10,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#636e72',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
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
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
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
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },


});