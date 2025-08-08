import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Chat from './Chat'
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

/**
 * ProfileScreen
 * Displays user profile info, notifications, and menu options.
 * Features:
 * - Fetches user email, image, and notification count from Firebase
 * - Shows profile image, name, email, and activity button
 * - Shows menu for profile settings, orders, help, and sign out
 * - Handles sign out with confirmation modal
 * - Updates notification count in real-time
 */
const ProfileScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();

  // Username and address from navigation params

  // State for profile image URL
  const [imageUrl, setImageUrl] = useState('');
  // State for sign out loader
  const [isSigningOut, setIsSigningOut] = useState(false);
  // State for email fetched from DB
  const [dbEmail, setDbEmail] = useState('');
  // State for notification badge count
  const [notificationCount, setNotificationCount] = useState(0);
  // State for selected image (not used here)
  const [selectedImage, setSelectedImage] = useState('');
  // State for full profile data from DB
  const [profileData, setProfileData] = useState({});
  // State for sign out confirmation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [username,setUsername]=useState('');
    const [address,setAddress]=useState('');



  // User display name
  const name = username || 'User';




   const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');

      if (storedUsername) setUsername(storedUsername);
      if (storedAddress) setAddress(storedAddress);
    } catch (error) {
      console.error('Error loading user data from AsyncStorage:', error);
    }
  };
  useEffect(() => {
  let interval;
  if (isFocused) {
    loadUserData().then(() => {
      if (username) {
        fetchEmail(username);
        fetchNotificationCount(username);
        interval = setInterval(() => fetchNotificationCount(username), 1000);
      }
    });
  }
  return () => clearInterval(interval);
}, [isFocused, username]);

  /**
   * Fetch user email and profile image from Firebase
   */
  const fetchEmail = async (uname) => {
  try {
    const res = await axios.get(
      `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${uname}.json`
    );
    if (res.data) {
      setDbEmail(res.data.email || 'No email');
      setImageUrl(res.data.image || '');
      setProfileData(res.data);
    } else {
      setDbEmail('No email found');
      setImageUrl('');
    }
  } catch (err) {
    console.log('Error fetching email/image:', err);
    setDbEmail('Error fetching email');
    setImageUrl('');
  }
};

const fetchNotificationCount = async (uname) => {
  try {
    const res = await axios.get(
      `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${uname}/notifications.json`
    );
    const data = res.data;

    if (data) {
      const unreadNotifications = Object.values(data).filter(
        n => typeof n.isRead !== 'undefined' && n.isRead === false
      );
      const newCount = unreadNotifications.length;

      // फक्त बदल झाला तरच state update कर
      if (newCount !== notificationCount) {
        setNotificationCount(newCount);
      }
    } else {
      if (notificationCount !== 0) {
        setNotificationCount(0);
      }
    }
  } catch (err) {
    console.error('❌ Error fetching notification count from DB:', err);
  }
};

 

  /**
   * Handle user sign out
   * - Removes username and address from AsyncStorage
   * - Navigates to Welcome screen
   */
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true); // Show loader
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('address');
      setTimeout(() => {
        setIsSigningOut(false); // Hide loader
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }, 1000); // Delay for smooth UX
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  /**
   * Profile menu item component
   */
  const ProfileItem = ({ icon, text, onPress, badge }) => (
    <TouchableOpacity style={styles.simpleMenuItem} onPress={onPress}>
      <View style={styles.simpleMenuItemContent}>
        <View style={styles.simpleIconContainer}>
          <FontAwesome name={icon} size={22} color="#4B5563" />
        </View>
        <View style={styles.simpleTextContainer}>
          <Text style={styles.simpleText}>{text}</Text>
          {badge && (
            <View style={styles.simpleBadge}>
              <Text style={styles.simpleBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );


  // Main UI render
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4F46E5" barStyle="light-content" />
      {/* Header with back and notification buttons */}
      <LinearGradient colors={['#6C63FF', '#3F2B96']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

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
            {/* Notification badge if unread notifications exist */}
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Profile info and menu */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile image, name, email, and activity button */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                imageUrl
                  ? { uri: imageUrl }
                  : require('../img/profile.png')
              }
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: '#fff',
                alignSelf: 'center',
                marginBottom: 10,
              }}
            />
          </View>

          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{dbEmail}</Text>


        </View>

        {/* Menu options */}
        <View style={styles.menuContainer}>
          <ProfileItem icon="cog" text="Profile Settings" bg="#6366F1" onPress={() => navigation.navigate('ProfileSettingsScreen', { username: name })}
          />
          <ProfileItem icon="history" text="My Orders" bg="#14B8A6" onPress={() => navigation.navigate('OrderHistoryScreen', { username: name })} />
          <ProfileItem icon="question-circle" text="Help & Support" bg="#F59E0B" onPress={() => navigation.navigate('HelpSupportScreen', { username: name ,address: address,})} />
          <ProfileItem
            icon="info-circle"
            text="About"
            bg="#3B82F6"
            onPress={() => navigation.navigate('AboutScreen', { username: name })}
          />
          {/* <ProfileItem
            icon="gift"
            text="Refer & Get Free Order"
            bg="#22C55E"
            onPress={() => navigation.navigate('ReferScreen', { username: name })}
          /> */}

        </View>

        {/* Sign out button */}
        <TouchableOpacity style={styles.signOutContainer} onPress={() => setModalVisible(true)}>
          <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.signOutGradient}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for sign out confirmation */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            {isSigningOut ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: '#1F2937' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#DC2626' }]}
                  onPress={handleSignOut}
                >
                  <Text style={{ color: '#fff' }}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <Chat />

    </View>
  );
};


const styles = StyleSheet.create({
  // 🔹 Container
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // 🔹 Header
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
  },
  notificationBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 🔹 ScrollView
  scrollView: {
    flex: 1,
    paddingTop: 30,
  },

  // 🔹 Profile Section
  profileSection: {
    marginTop: 30,
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 50,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 15,
  },
  viewActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  viewActivityText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 5,
  },

  // 🔹 Menu Section
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  menuItem: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  menuItemGradient: {
    padding: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 🔹 Sign Out Button
  signOutContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 56,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 15,
    elevation: 5,
  },
  signOutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  simpleMenuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },

  simpleMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB', // Light gray circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  simpleTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },

  simpleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },

  simpleBadgeText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: 'bold',
  },

});
export default ProfileScreen;