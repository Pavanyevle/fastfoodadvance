import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Success',
        'Password reset link sent! Please check your email.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.card}>
        <Ionicons name="lock-closed-outline" size={48} color="#6366f1" style={{ alignSelf: 'center', marginBottom: 10 }} />
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email to receive a password reset link.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 18 }}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 28,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E3A59',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e7ff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
    color: '#2E3A59',
    backgroundColor: '#f6f8fb',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
});

export default ForgotPassword;