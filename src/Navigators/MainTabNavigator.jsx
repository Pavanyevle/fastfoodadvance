import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

import Home from '../Screens/Home';
import OrderScreen from '../Screens/OrderScreen';
import Profile from '../Screens/Profile';
import SearchScreen from '../Screens/SearchScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const address = 'Nashik Road, Maharashtra, India 422101';
  const [username, setUsername] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <FontAwesome name="home" size={size} color={color} />;
          } else if (route.name === 'Search') {
            return <MaterialIcons name="search" size={size} color={color} />;
          } else if (route.name === 'My Cart') {
            return <Ionicons name="cart-outline" size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <Feather name="user" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="Home"
        children={(props) => <Home {...props} username={username} address={address} />}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        initialParams={{ username, address }}
      />
      <Tab.Screen
        name="My Cart"
        component={OrderScreen}
        initialParams={{ username, address }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        initialParams={{ username, address }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;