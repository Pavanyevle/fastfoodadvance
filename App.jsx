import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, PermissionsAndroid, Platform, Alert, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';

// Screens
import Welcome from './src/Screens/Welcome';
import SearchScreen from './src/Screens/SearchScreen';
import Login from './src/Screens/Login';
import NotificationScreen from './src/Screens/NotificationScreen';
import Profile from './src/Screens/Profile';
import SignUp from './src/Screens/SignUp';
import Forgot from './src/Screens/Forgot';
import ItemCard from './src/Screens/ItemCard';
import CategoriesScreen from './src/Screens/CategoriesScreen';
import ProfileSettingsScreen from './src/Screens/ProfileSettingsScreen';
import PopularRecipesScreen from './src/Screens/PopularRecipesScreen';
import OrderScreen from './src/Screens/OrderScreen';
import PaymentScreen from './src/Screens/PaymentScreen';
import OrderHistoryScreen from './src/Screens/OrderHistoryScreen';
import FavoritesScreen from './src/Screens/FavoritesScreen';
import Chat from './src/Screens/Chat';
import OrderStatusScreen from './src/Screens/OrderStatusScreen';
import Home from './src/Screens/Home';
import ChatBot from './src/Screens/ChatBot';
import AboutScreen from './src/Screens/AboutScreen';
import ReferScreen from './src/Screens/ReferScreen';
import HelpSupportScreen from './src/Screens/HelpSupportScreen';
import MainTabNavigator from './src/Navigators/MainTabNavigator';

const Stack = createNativeStackNavigator();

/**
 * App
 * Main entry point for the application.
 * Handles:
 * - User authentication check (auto-login using AsyncStorage)
 * - Firebase Cloud Messaging (push notifications)
 * - Navigation setup for all screens
 */
const App = () => {
  // State for initial route (Welcome, Login, or MainTabs)
  const [initialRoute, setInitialRoute] = useState(null);
  // State for logged-in username
  const [username, setUsername] = useState(null);

  /**
   * On mount: Check if user is logged in using AsyncStorage.
   * - If valid, set initial route to MainTabs.
   * - If not, set to Welcome or Login.
   */
  useEffect(() => {
    const checkUser = async () => {
      try {
        const username = await AsyncStorage.getItem('username');
        const password = await AsyncStorage.getItem('password');

        if (username && password) {
          const res = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`);
          const firebaseUser = res.data;

          if (firebaseUser && firebaseUser.password === password) {
            setUsername(username);
            setInitialRoute('MainTabs');
          } else {
            await AsyncStorage.multiRemove(['username', 'password']);
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Welcome');
        }
      } catch (e) {
        console.log('Error checking user:', e);
        setInitialRoute('Welcome');
      }
    };

    checkUser();
  }, []);

  /**
   * Firebase Notification Setup
   * - Requests notification permission (Android 13+)
   * - Gets FCM token
   * - Sets up listeners for foreground/background notifications
   * - Stores notifications in Firebase DB
   */
  useEffect(() => {
    // Request notification permission (Android 13+)
    const requestUserPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('Notification permission:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    // Get FCM token for push notifications
    const getFcmToken = async () => {
      const token = await messaging().getToken();
      console.log('🔥 FCM Token:', token);
    };

    // Store notification in Firebase DB for the user
    const storeNotificationToDatabase = async (username, notification) => {
      try {
        await axios.post(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/notifications.json`,
          {
            title: notification.notification.title,
            message: notification.notification.body,
            icon: 'notifications-outline', // Notification icon
            color: '#0984e3', // Notification color
            time: new Date().toISOString(),
            isRead: false,
          }
        );
        console.log('✅ Notification stored in database');
      } catch (err) {
        console.log('❌ Failed to store notification:', err.message);
      }
    };

    // Setup notification listeners for foreground/background
    const setupNotificationListeners = () => {
      // Foreground notification handler
      messaging().onMessage(async remoteMessage => {
        console.log('📩 Foreground Notification:', remoteMessage);

        // Show alert
        Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);

        // Store notification in Firebase
        if (username) {
          storeNotificationToDatabase(username, remoteMessage);
        }
      });

      // Background notification handler
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('📩 Background Notification:', remoteMessage);

        // Store notification in Firebase
        if (username) {
          storeNotificationToDatabase(username, remoteMessage);
        }
      });
    };

    // Initialize FCM setup
    const setupFCM = async () => {
      await requestUserPermission();
      await getFcmToken();
      setupNotificationListeners();
    };

    setupFCM();
  }, []);

  // Show loading screen while determining initial route
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View>
          <Image
            source={require('./src/img/logo.png')}
            style={styles.image}
          />
        </View>
      </View>
    );
  }

  // Main navigation container and stack setup
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Forgot" component={Forgot} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="ItemCard" component={ItemCard} />
        <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} />
        <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} />
        <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} />
        <Stack.Screen name="OrderScreen" component={OrderScreen} />
        <Stack.Screen name="OrderStatusScreen" component={OrderStatusScreen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        <Stack.Screen name="OrderHistoryScreen" component={OrderHistoryScreen} />
        <Stack.Screen name="PopularRecipesScreen" component={PopularRecipesScreen} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ChatBot" component={ChatBot} />
        <Stack.Screen name="AboutScreen" component={AboutScreen} />
        <Stack.Screen name="ReferScreen" component={ReferScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius:20,
    resizeMode: 'cover',
  },
});

export default App;