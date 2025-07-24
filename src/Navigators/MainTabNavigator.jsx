import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react'; import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

import Home from '../Screens/Home';
import OrderScreen from '../Screens/OrderScreen';
import ChatBot from '../Screens/ChatBot';
import Profile from '../Screens/Profile';
import SearchScreen from '../Screens/SearchScreen';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const CustomTabBar = (props) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {props.state.routes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = props.state.index === index;

          const onPress = () => {
            const event = props.navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              props.navigation.navigate(route.name);
            }
          };

          const Icon = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.activeTab]}
              activeOpacity={0.8}
            >
              <View style={isFocused ? styles.iconBubble : styles.inactiveIcon}>
                {Icon &&
                  Icon({
                    color: isFocused ? '#fff' : '#888',
                    size: isFocused ? 26 : 22,
                  })}
              </View>
              {isFocused && <Text style={styles.label}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabNavigator = ({ navigation, route }) => {
  const address = 'Nashik Road, Maharashtra, India 422101';
  const [username, setUsername] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const username = await AsyncStorage.getItem('username');
        const password = await AsyncStorage.getItem('password');
        const address = await AsyncStorage.getItem('address');

        console.log('Username:', username);
        console.log('Password:', password);
        console.log('Address:', address);

        if (username) {
          setUsername(username); // ✅ जो state में चाहिए वो set करो
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);




  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
     <Tab.Screen
  name="Home"
  children={(props) => (
    <Home
      {...props}
      username={username}
      address={address}
    />
  )}
  options={{
    tabBarIcon: ({ color, size }) => (
      <FontAwesome name="home" size={size} color={color} />
    ),
  }}
/>

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        initialParams={{ username, address }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="My Cart"
        component={OrderScreen}
        initialParams={{ username, address }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        initialParams={{ username, address }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)', // for web — ignore if using only on mobile
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffffee',
    borderRadius: 30,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: '#ff6347',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 6,
    shadowColor: '#ff6347',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  iconBubble: {
    backgroundColor: 'transparent',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    padding: 4,
    opacity: 0.7,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
  },
});

export default MainTabNavigator;
