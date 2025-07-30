// Chat.js

import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // ✅ Add this

const Chat = () => {
  const [username, setUsername] = useState('');
  const navigation = useNavigation(); // ✅ Fix here

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (e) {
        console.log('❌ Username fetch error:', e);
      }
    };

    fetchUsername();
  }, []);

  const handlePress = () => {
    if (username) {
      navigation.navigate('ChatBot');
    } else {
      console.log('⚠ Username not found');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default Chat;


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    right: 10,
    zIndex: 999,
  },
  button: {
    backgroundColor: '#667eea',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
