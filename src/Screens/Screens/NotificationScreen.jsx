import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const mockNotifications = [
  {
    id: '1',
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order #ORD123 has been delivered. Enjoy your meal!',
    time: '2 min ago',
    icon: 'checkmark-done-circle',
    color: '#4caf50',
  },
  {
    id: '2',
    type: 'offer',
    title: 'Special Offer!',
    message: 'Get 20% OFF on your next order. Use code: FOODIE20',
    time: '1 hr ago',
    icon: 'pricetag',
    color: '#ff9800',
  },
  {
    id: '3',
    type: 'delivery',
    title: 'Order On The Way',
    message: 'Your order #ORD124 is out for delivery.',
    time: '10 min ago',
    icon: 'bicycle',
    color: '#2196f3',
  },
];

const NotificationScreen = () => {
  const renderNotification = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}> 
        <Ionicons name={item.icon} size={28} color="#fff" />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>
      <FlatList
        data={mockNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#667eea',
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