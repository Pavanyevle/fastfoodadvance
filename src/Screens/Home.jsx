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
  PermissionsAndroid,
  Linking
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [promos, setPromos] = useState([]); // Promo banners
  const [locationLoading, setLocationLoading] = useState(false); // Location loading state
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error

  // Ref for geolocation watch
  const watchIdRef = useRef(null);

  /**
   * Check if location services are enabled
   */
  const checkLocationServices = () => {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000, maximumAge: 0 }
      );
    });
  };

  /**
   * Request location permission for Android with proper handling
   */
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check if location services are enabled first
        const locationEnabled = await checkLocationServices();
        if (!locationEnabled) {

          return false;
        }

        // Request permissions
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'SpeedyBite needs access to your location to provide accurate delivery services',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {

          return false;
        } else {
          return false;
        }
      } catch (err) {
        console.warn('Permission request error:', err);

        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  /**
   * Get exact location with improved accuracy and error handling
   */
  const getExactLocation = () => {
    return new Promise((resolve, reject) => {
      // First try with high accuracy
      const highAccuracyOptions = {
        enableHighAccuracy: true,
        timeout: 30000, // Reduced to 30 seconds
        maximumAge: 0, // Force fresh location
        distanceFilter: 0, // Get every location change
        forceRequestLocation: true, // Force location request
      };

      // Fallback options with lower accuracy
      const fallbackOptions = {
        enableHighAccuracy: false,
        timeout: 15000, // 15 seconds for fallback
        maximumAge: 60000, // Accept location up to 1 minute old
        distanceFilter: 10, // 10 meters
      };

      const tryGetLocation = (options, isFallback = false) => {
        Geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Location obtained:', position.coords);
            console.log('📍 Accuracy:', position.coords.accuracy, 'meters');
            console.log('📍 Timestamp:', new Date(position.timestamp).toLocaleString());
            console.log('📍 Using fallback:', isFallback);

            // Check if accuracy is acceptable
            if (position.coords.accuracy > 100 && !isFallback) {
              console.warn('⚠️ Poor accuracy, trying fallback...');
              tryGetLocation(fallbackOptions, true);
              return;
            }

            resolve(position.coords);
          },
          (error) => {
            console.error('❌ Location error:', error);

            // If high accuracy failed, try fallback
            if (!isFallback) {
              console.log('🔄 Trying fallback location...');
              tryGetLocation(fallbackOptions, true);
              return;
            }

            let errorMessage = 'Unable to get your location.';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location access.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your GPS settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'Location error occurred. Please try again.';
            }

            reject(new Error(errorMessage));
          },
          options
        );
      };

      // Start with high accuracy
      tryGetLocation(highAccuracyOptions);
    });
  };

  /**
   * Get network-based location as last resort
   */
  const getNetworkLocation = () => {
    return new Promise((resolve, reject) => {
      const networkOptions = {
        enableHighAccuracy: false,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // Accept location up to 5 minutes old
        distanceFilter: 100, // 100 meters
      };

      Geolocation.getCurrentPosition(
        (position) => {
          console.log('🌐 Network location obtained:', position.coords);
          console.log('🌐 Accuracy:', position.coords.accuracy, 'meters');
          resolve(position.coords);
        },
        (error) => {
          console.error('❌ Network location error:', error);
          reject(new Error('Network location unavailable'));
        },
        networkOptions
      );
    });
  };

  /**
   * Reverse geocode coordinates to address using multiple services with improved error handling
   */
  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🌍 Reverse geocoding for:', latitude, longitude);

      // Try OpenStreetMap first
      const osmResponse = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1,
            zoom: 18, // Get detailed address
            'accept-language': 'en' // Request English results
          },
          headers: {
            'User-Agent': 'SpeedyBite/1.0',
          },
          timeout: 15000, // Increased timeout to 15 seconds
        }
      );

      if (osmResponse.data && osmResponse.data.display_name) {
        console.log('✅ Address resolved:', osmResponse.data.display_name);
        return osmResponse.data.display_name;
      }

      // Fallback to coordinates if geocoding fails
      console.log('⚠️ Geocoding failed, using coordinates');
      return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  /**
   * Update location in Firebase and AsyncStorage
   */
  const updateLocationInStorage = async (latitude, longitude, address) => {
    try {
      if (username) {
        await axios.patch(
          `${FIREBASE_DB_URL}/users/${username}.json`,
          {
            address: address,
            currentLocation: {
              latitude,
              longitude,
              address,
              lastUpdated: new Date().toISOString()
            }
          }
        );
      }

      await AsyncStorage.setItem('userLocation', JSON.stringify({
        latitude,
        longitude,
        address
      }));

      await AsyncStorage.setItem('address', address);
      console.log('✅ Location updated in storage');
    } catch (error) {
      console.error('❌ Error updating location storage:', error);
    }
  };

  /**
   * Debug location services and permissions
   */
  const debugLocationServices = async () => {
    try {
      console.log('🔍 Debugging location services...');

      // Check if geolocation is available
      if (!Geolocation) {
        console.error('❌ Geolocation not available');
        return;
      }

      // Check permissions
      const hasPermission = await requestLocationPermission();
      console.log('📍 Permission status:', hasPermission);

      // Check location services
      const locationEnabled = await checkLocationServices();
      console.log('📍 Location services enabled:', locationEnabled);

      // Try to get current position with debug info
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Debug location success:', position);

        },
        (error) => {
          console.error('❌ Debug location error:', error);

        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('❌ Debug error:', error);
      Alert.alert('Debug Error', error.message);
    }
  };



  /**
   * Initialize location tracking with improved error handling
   */
  const initializeLocationTracking = async () => {
    try {
      setLocationLoading(true);
      setLocationStatus('loading');
      console.log('🚀 Starting location tracking...');

      // Request permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('❌ Location permission denied');
        setLocationStatus('error');
        setLocationLoading(false);
        return;
      }

      console.log('✅ Permission granted, getting location...');

      // Try to get location with multiple fallback strategies
      let coords = null;
      let retryCount = 0;
      const maxRetries = 2; // Reduced retries since we have fallbacks

      while (!coords && retryCount < maxRetries) {
        try {
          console.log(`📍 Attempt ${retryCount + 1} to get location...`);
          coords = await getExactLocation();
          break;
        } catch (error) {
          retryCount++;
          console.log(`❌ Location attempt ${retryCount} failed:`, error.message);

          if (retryCount < maxRetries) {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Try network-based location as last resort
            try {
              console.log('🌐 Trying network-based location...');
              coords = await getNetworkLocation();
              break;
            } catch (networkError) {
              console.error('❌ Network location also failed:', networkError);
              throw error; // Throw original error
            }
          }
        }
      }

      if (!coords) {
        throw new Error('Failed to get location after multiple attempts');
      }

      console.log('📍 Final coordinates:', coords);

      // Reverse geocode to get address
      const resolvedAddress = await reverseGeocode(coords.latitude, coords.longitude);
      console.log('📍 Resolved address:', resolvedAddress);

      // Update UI and storage
      setAddress(resolvedAddress);
      await updateLocationInStorage(coords.latitude, coords.longitude, resolvedAddress);
      setLocationStatus('success');

      // Start continuous location monitoring
      startLocationMonitoring();

    } catch (error) {
      console.error('❌ Location initialization error:', error);
      setLocationStatus('error');

    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Start continuous location monitoring with improved settings
   */
  const startLocationMonitoring = () => {
    // Clear any existing watcher
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    const options = {
      enableHighAccuracy: true,
      distanceFilter: 5, // Update every 5 meters (reduced for better accuracy)
      interval: 10000, // Update every 10 seconds
      fastestInterval: 5000, // Fastest update every 5 seconds
      forceRequestLocation: true,
    };

    console.log('🔄 Starting location monitoring...');

    watchIdRef.current = Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('🔴 Live location update:', latitude, longitude, 'Accuracy:', accuracy);

        try {
          const newAddress = await reverseGeocode(latitude, longitude);
          setAddress(newAddress);
          await updateLocationInStorage(latitude, longitude, newAddress);
        } catch (error) {
          console.error('❌ Live location update error:', error);
        }
      },
      (error) => {
        console.error('❌ Location watcher error:', error);
        // Try to restart monitoring if there's an error
        setTimeout(() => {
          console.log('🔄 Restarting location monitoring...');
          startLocationMonitoring();
        }, 5000);
      },
      options
    );
  };

  /**
   * Load cached location from storage
   */
  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem('userLocation');
      const cachedAddress = await AsyncStorage.getItem('address');

      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        console.log('📱 Loaded cached location:', location);

        if (cachedAddress) {
          setAddress(cachedAddress);
          setLocationStatus('success');
        } else if (location.latitude && location.longitude) {
          // If we have coordinates but no address, try to geocode
          const address = await reverseGeocode(location.latitude, location.longitude);
          setAddress(address);
          setLocationStatus('success');
        }
      }
    } catch (error) {
      console.error('❌ Error loading cached location:', error);
      setLocationStatus('error');
    }
  };

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
          title1: data[key].title1 || '',
          title2: data[key].title2 || '',
          subtitle: data[key].subtitle || '',
          bgColor: Array.isArray(data[key].bgColor) ? data[key].bgColor : ['#667eea', '#764ba2'],
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
        `${FIREBASE_DB_URL}/users/${username}/notifications.json`
      );
      const data = res.data;
      if (data) {
        const unread = Object.values(data).filter(n => n.isRead === false);
        setNotificationCount(prevCount => prevCount + 1);
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
          setProfileImage(userData.image || null);
          setProfileData(userData);
        }
      }

      if (storedAddress) setAddress(storedAddress);
    } catch (e) {
      console.log('❌ Error loading user data:', e);
    }
  };

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
   * Main effect: set greeting, load user/foods/offers/notifications/promos on focus
   */


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning !');
    else if (hour < 18) setGreeting('Good Afternoon !');
    else setGreeting('Good Evening !');

    if (isFocused) {
      Promise.all([
        loadUserData(),
        fetchFoods(),
        fetchLatestOffers(),
        fetchNotificationCount(),
        fetchPromos()
      ]).finally(() => setLoading(false));

      loadCachedLocation().then(() => {
        setTimeout(() => {
          initializeLocationTracking();
        }, 1000);
      });
    }
  }, [isFocused]);


  // Cleanup location watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

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
              <Text style={styles.loaderText}>Loading ...</Text>
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
                  <TouchableOpacity
                    style={styles.locationBtn}
                    onPress={initializeLocationTracking}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <EvilIcons
                        name="location"
                        size={20}
                        color={locationStatus === 'success' ? '#4CAF50' : locationStatus === 'error' ? '#FF5722' : '#fff'}
                      />
                    )}
                    <Text
                      style={styles.locationText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {address || 'Tap to get location...'}
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
                    <View style={styles.badge}>
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
              {promos.length > 0 && (
                <Swiper
                  autoplay
                  autoplayTimeout={2}
                  showsPagination={true}
                  dotColor="rgba(255,255,255,0.5)"
                  activeDotColor="#fff"
                  paginationStyle={{ bottom: 10, position: 'absolute' }}
                  style={{ height: 170 }}
                >
                  {promos.map((item, index) => (
                    <View key={index} style={styles.slideContainer}>
                      <LinearGradient
                        colors={item.bgColor || ['#667eea', '#764ba2']}
                        style={styles.promoCard}
                      >
                        <View style={styles.promoContent}>
                          <View style={styles.promoTextContainer}>
                            <Text style={styles.promoTitle}>{item.title1 || ''}</Text>
                            <Text style={styles.promoSubtitle}>{item.title2 || ''}</Text>
                            <Text style={styles.promoDesc}>{item.subtitle || ''}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </Swiper>
              )}
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
      <Chat />
    </View>
  );
};

export default Home;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 135,
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
  refreshLocationBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 6,
  },
  debugBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 6,
  },
  locationStatusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
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
    height: 170,
    marginBottom: 20,
  },
  slideContainer: {
    paddingHorizontal: 20,
  },
  promoCard: {
    borderRadius: 20,
    height: 170,
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
});