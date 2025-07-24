import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Swiper from 'react-native-swiper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';


const { width } = Dimensions.get('window');

const FIREBASE_DB_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/';

const Home = ({ navigation, route }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [latestOffers, setLatestOffers] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [profileData, setProfileData] = useState({});
  const isFocused = useIsFocused();





  const [notificationCount, setNotificationCount] = useState(0);



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


  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');

      if (storedUsername) {
        setUsername(storedUsername);

        // 🔄 Profile image + email load
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


  const getCurrentLocation = async () => {
    try {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ Location permission denied');
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
              lat: latitude,
              lon: longitude,
              format: 'json'
            }
          });


          const currentAddress = response.data?.display_name || 'Unknown Address';

          setAddress(currentAddress); // ✅ UI के लिए

          // 🔄 Firebase में Save करो
          const username = await AsyncStorage.getItem('username');
          if (username) {
            const url = `${FIREBASE_DB_URL}/users/${username}.json`;
            await axios.patch(url, { address: currentAddress });
          }

          // 🔄 AsyncStorage में भी Save करो
          await AsyncStorage.setItem('address', currentAddress);

          console.log('📍 Address Updated:', currentAddress);
        },
        (error) => {
          console.log('❌ Location error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.log('❌ Location fetch failed:', error.message);
    }
  };





  const foodItems = [
    { id: '1', name: 'Burger', image: require('../img/burger.jpeg'), icon: 'hamburger' },
    { id: '2', name: 'Pizza', image: require('../img/pizza.jpg'), icon: 'pizza' },
    { id: '3', name: 'Salad', image: require('../img/salad.jpg'), icon: 'food-apple' },
    { id: '4', name: 'Chicken', image: require('../img/chiken.jpg'), icon: 'food-drumstick' },
    { id: '5', name: 'Desserts', image: require('../img/dosa.jpg'), icon: 'cake-variant' },
    { id: '6', name: 'Drinks', image: require('../img/burger.jpeg'), icon: 'cup-water' },
  ];





  const promoSlides = [
    {
      title1: 'Get 50% OFF',
      title2: 'on First Order!',
      subtitle: 'No delivery fee on ₹149+',
      image: require('../img/burger1.png'),
      bgColor: ['#FF5722', '#FF7043'],
    },
    {
      title1: 'Fast Biryani?',
      title2: 'Delivered Hot',
      subtitle: 'Under 30 minutes!',
      bgColor: ['#4CAF50', '#66BB6A'],
    },
    {
      title1: 'Snacks Hour!',
      title2: 'Up to 30% OFF',
      subtitle: 'Evening 4 PM to 6 PM',
      bgColor: ['#FF9800', '#FFB74D'],
    },
    {
      title1: 'Zero Delivery Fee',
      title2: 'on Popular Restaurants',
      subtitle: 'Limited Time Only',
      image: require('../img/delivery_free.png'),
      bgColor: ['#3F51B5', '#5C6BC0'],
    },
    {
      title1: 'Weekend Special',
      title2: 'Family Feast Packs',
      subtitle: 'Combo + Drinks + Dessert',
      bgColor: ['#9C27B0', '#BA68C8'],
    },
    {
      title1: 'Midnight Cravings?',
      title2: 'We Deliver Till 2 AM!',
      subtitle: 'Late Night Meals Available',
      bgColor: ['#263238', '#37474F'],
    },
    {
      title1: 'Healthy Bowls',
      title2: 'For Fitness Freaks',
      subtitle: 'Low-cal & high protein',
      bgColor: ['#00C853', '#4CAF50'],
    },
    {
      title1: 'Refer & Earn ₹100',
      title2: 'Share App with Friends!',
      subtitle: 'They order, you earn',
      bgColor: ['#00BCD4', '#26C6DA'],
    },
  ];


  const renderFoodItem = ({ item }) => (
    <TouchableOpacity style={styles.foodItem}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.foodItemGradient}
      >
        <MaterialCommunityIcons name={item.icon} size={30} color="#fff" />
      </LinearGradient>
      <Text style={styles.foodName}>{item.name}</Text>
    </TouchableOpacity>
  );
  const renderPopularRecipe = ({ item }) => {
    console.log("📸 Image URL:", item.image);

    return (
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
  };

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




  const fetchLatestOffers = async () => {
    try {
      const offerRes = await axios.get(`${FIREBASE_DB_URL}/offers.json`);
      const offerData = offerRes.data;

      if (offerData) {
        const offersArray = Object.keys(offerData).map(key => ({
          id: key,
          ...offerData[key],
        }));

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
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning !');
    else if (hour < 18) setGreeting('Good Afternoon !');
    else setGreeting('Good Evening !');

    if (isFocused) {
      loadUserData(); // 🔄 Profile + Address
      fetchFoods();    // 🔄 Food Items
      fetchLatestOffers(); // 🔄 Offers
      fetchNotificationCount(); // 🔄 Notification
      getCurrentLocation(); // 🔄 Location
    }
  }, [isFocused]);


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#667eea' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() =>
                navigation.navigate('Profile', { username: username, address: address })
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
              <View style={{
                width: 100,
                height: 25,
                overflow: 'hidden',
                alignSelf: 'center',
              }}>
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
                  Nashik Road, Maharashtra, India 422101
                </Text>
              </TouchableOpacity>
            </View>



            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() =>
                navigation.navigate('NotificationScreen', {
                  username: username,
                  address: address,
                })
              }
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {/* 🔻 Badge तभी दिखे जब count > 0 */}
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() =>
              navigation.navigate('SearchScreen', {
                username: username,
                address: address,
              })
            }
          >
            <Feather name="search" size={20} color="#667eea" />
            <Text style={styles.searchPlaceholder}>Search foods...</Text>
          </TouchableOpacity>
        </View>

        {/* Promotional Slider */}
        <View style={styles.sliderContainer}>
          <Swiper
            autoplay
            autoplayTimeout={4}
            showsPagination={true}
            dotColor="rgba(255,255,255,0.5)"
            activeDotColor="#fff"
            paginationStyle={styles.pagination}
          >
            {promoSlides.map((item, index) => (
              <View key={index} style={styles.slideContainer}>
                <LinearGradient
                  colors={item.bgColor}
                  style={styles.promoCard}
                >
                  <View style={styles.promoContent}>
                    <View style={styles.promoTextContainer}>
                      <Text style={styles.promoTitle}>{item.title1}</Text>
                      <Text style={styles.promoSubtitle}>{item.title2}</Text>
                      <Text style={styles.promoDesc}>{item.subtitle}</Text>
                    
                    </View>
                    {item.image && (
                      <Image source={item.image} style={styles.promoImage} />
                    )}
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Swiper>
        </View>

        {/* Categories Section */}
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

        {/* Popular Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Recipes</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('PopularRecipesScreen', { username: username, address: address })}
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

        {/* Latest Offers Section */}
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
    </View>
  );
};

export default Home;

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
    marginBottom:10,
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
    marginBottom:10,
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
});