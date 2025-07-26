import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';


const AboutScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />

     <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.header}>
  <View style={styles.headerRow}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.headerText}>About FastFood</Text>
  </View>
</LinearGradient>


      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../img/logo.png')} // 🔁 तुमचा logo path इथे द्या
          style={styles.logo}
        />
        <Text style={styles.appName}>FastFood</Text>
        <Text style={styles.version}>Version 1.0.0</Text>

        <Text style={styles.description}>
          FastFood is your go-to food delivery app that brings your favorite meals from the best restaurants right to your door — fast, hot, and tasty!
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developed By</Text>
          <Text style={styles.sectionText}>Pavan Yevle</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionText}>📧 pavanyevle6@email.com</Text>
          <Text style={styles.sectionText}>📞 +91-9144612496</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.sectionText}>1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  version: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 25,
  },
  section: {
    width: '100%',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
  },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 10,
},
backButton: {
backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 25,
  marginTop:30,
  marginRight: 50,
},
headerText: {
  color: '#fff',
  fontSize: 22,
  fontWeight: 'bold',
    marginRight: 100,
    textAlign: 'center',
    marginTop:30,
},

});
