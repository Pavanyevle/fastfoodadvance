// src/Screens/AppStartScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

const AppStartScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const session = await EncryptedStorage.getItem("user_session");

        if (session) {
          const data = JSON.parse(session);
          if (data.isLoggedIn) {
            navigation.replace("MainTabs", { username: data.username });
          } else {
            navigation.replace("Welcome");
          }
        } else {
          navigation.replace("Welcome");
        }
      } catch (error) {
        console.log("Error checking session:", error);
        navigation.replace("Welcome");
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
};

export default AppStartScreen;
