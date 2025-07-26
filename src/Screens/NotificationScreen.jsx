import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';

/**
 * NotificationScreen
 * Displays a list of notifications for the user.
 * Features:
 * - Fetches notifications from Firebase
 * - Marks notifications as read when tapped
 * - Shows loading indicator while fetching
 * - Displays time in "from now" format
 */
const NotificationScreen = ({ navigation, route }) => {
  // Get username and address from navigation params
  const { username, address } = route.params;
  // State for notifications list
  const [notifications, setNotifications] = useState([]);
  // Loading state for fetching notifications
  const [loading, setLoading] = useState(true);

  /**
   * Handle notification press
   * Marks notification as read in Firebase and refreshes the list
   */
  const handleNotificationPress = async (item) => {
    try {
      await axios.patch(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/notifications/${item.id}.json`,
        {
          isRead: true,
        }
      );
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error.message);
    }
  };

  /**
   * Fetch notifications from Firebase
   * Sorts notifications by time (latest first)
   */
  const fetchNotifications = async () => {
    try {
      setLoading(true); // Start loader

      const res = await axios.get(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}/notifications.json`
      );

      const data = res.data;

      if (data) {
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const sorted = parsed.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(sorted);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
    } finally {
      setLoading(false); // Stop loader
    }
  };

  /**
   * Utility: Get current time in IST as ISO string
   */
  const getIndianTimeISOString = () => {
    const now = new Date();
    // IST = UTC + 5.5 hours
    const istOffset = 7.5 * 60 * 60 * 1000; // milliseconds
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString();
  };

  // Fetch notifications when screen mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  /**
   * Render a single notification card
   */
  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: item.isRead ? '#e9ecef' : '#ffffff' }, // Read: light grey, Unread: white
      ]}
      activeOpacity={0.8}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={28} color="#fff" />
      </View>
      <View style={styles.textContent}>
        <Text
          style={[
            styles.title,
            { fontWeight: item.isRead ? 'normal' : 'bold' }, // Bold if unread
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {moment(item.time, moment.ISO_8601, true).isValid()
            ? moment(item.time).fromNow()
            : 'Unknown time'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Main UI render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Custom Header with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,}}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={{ width: 24 }} /> {/* for spacing balance */}
      </View>

      {/* Loader while fetching notifications */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={{ fontSize: 16, color: '#667eea', marginBottom: 10 }}>Loading Notifications...</Text>
          <StatusBar barStyle="dark-content" />
        </View>
      ) : (
        // Notifications list
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// Styles for NotificationScreen UI components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingRight: 20
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    color: '#ddd',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#b2bec3',
  },
});

export default NotificationScreen;