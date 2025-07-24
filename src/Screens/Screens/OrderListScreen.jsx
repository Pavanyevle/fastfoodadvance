import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const mockOrders = [
  {
    id: 'ORD123',
    date: '2024-06-01',
    items: [
      { name: 'Pizza', qty: 1 },
      { name: 'Burger', qty: 2 },
    ],
    total: 450,
    status: 'Delivered',
  },
  {
    id: 'ORD124',
    date: '2024-06-03',
    items: [
      { name: 'Pasta', qty: 1 },
    ],
    total: 250,
    status: 'On the way',
  },
];

const OrderListScreen = () => {
  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderId}>Order ID: {item.id}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Items:</Text>
      {item.items.map((orderItem, idx) => (
        <Text key={idx} style={styles.itemText}>
          - {orderItem.name} x {orderItem.qty}
        </Text>
      ))}
      <Text style={styles.total}>Total: ₹{item.total}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Orders</Text>
      <FlatList
        data={mockOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderId: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemText: {
    marginLeft: 8,
  },
  total: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#388e3c',
  },
});

export default OrderListScreen; 