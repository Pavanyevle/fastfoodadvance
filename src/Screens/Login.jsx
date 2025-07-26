import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get device height for responsive UI
const { height } = Dimensions.get('window');

/**
 * Login Screen
 * Handles both Sign In and Sign Up flows.
 * Features:
 * - User authentication (login/signup) with Firebase
 * - Form validation and error handling
 * - Password visibility toggle
 * - Remember me and forgot password
 * - Social login buttons (UI only)
 * - Loading indicators for async actions
 */
const Login = ({ navigation }) => {
  // State variables for form fields and UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/signup
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');

  // Helper to show error messages
  const showError = (msg) => setErrorMsg(msg);

  /**
   * Handle user sign up
   * - Validates input fields
   * - Checks if username exists in Firebase
   * - Creates new user in Firebase
   * - Stores credentials in AsyncStorage
   * - Navigates to MainTabs on success
   */
  const handleSignUp = async () => {
    setErrorMsg('');

    if (!username || !email || !password || !confirmPassword)
      return showError('Please fill all fields');
    if (password !== confirmPassword)
      return showError('Passwords do not match');
    if (password.length < 6)
      return showError('Password must be at least 6 characters');

    setLoadingSignup(true);

    try {
      // Check if username already exists
      const userExists = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`);

      if (userExists.data) {
        showError('Username already exists');
        setLoadingSignup(false);
        return;
      }

      // Create new user in Firebase
      await axios.put(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`,
        {
          email: email.trim(),
          password,
          address: '.....', // Default address
        }
      );
      // Store credentials locally
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('password', password);

      // Navigate to main app
      navigation.navigate('MainTabs', { username: username });
    } catch (error) {
      showError('Signup failed. Try again.');
      console.log(error);
    } finally {
      setLoadingSignup(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  /**
   * Handle user login
   * - Validates input fields
   * - Fetches user data from Firebase
   * - Checks password
   * - Stores credentials in AsyncStorage
   * - Navigates to MainTabs on success
   */
  const handleLogin = async () => {
    setErrorMsg('');

    if (!username || !password)
      return showError('Enter username and password');

    setLoadingLogin(true);

    try {
      // Fetch user data from Firebase
      const response = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`);
      const userData = response.data;

      if (!userData) {
        showError('Username not found');
      } else if (userData.password !== password) {
        showError('Incorrect password');
      } else {
        // Login success: store credentials
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('password', password);

        // Navigate to main app
        navigation.navigate('MainTabs', { username: username });
      }

    } catch (error) {
      showError('Login failed');
      console.log('Login Error:', error);
    } finally {
      setLoadingLogin(false);
    }
  };

  /**
   * Render a styled input field with icon and optional password visibility toggle
   */
  const renderInput = (icon, placeholder, value, onChangeText, isPassword = false, toggleVisibility, showValue) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword && !showValue}
        autoCapitalize="none"
      />
      {isPassword && (
        <TouchableOpacity onPress={toggleVisibility} style={styles.eyeButton}>
          <Ionicons name={showValue ? 'eye-off' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Main UI render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D2B" />
      {/* Header section with title and subtitle */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Welcome to FastFood</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}
        </Text>
      </View>

      {/* Main form container */}
      <View style={styles.formContainer}>
        {/* Tabs for switching between Sign In and Sign Up */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, isLogin && styles.activeTabButton]} onPress={() => setIsLogin(true)}>
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, !isLogin && styles.activeTabButton]} onPress={() => setIsLogin(false)}>
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form fields for login/signup */}
        <View style={styles.formFields}>
          {renderInput('person-outline', 'Username', username, setUsername)}
          {!isLogin && renderInput('mail-outline', 'Email address', email, setEmail)}
          {renderInput('lock-closed-outline', 'Password', password, setPassword, true, () => setShowPassword(!showPassword), showPassword)}
          {!isLogin && renderInput('lock-closed-outline', 'Confirm password', confirmPassword, setConfirmPassword, true, () => setShowConfirmPassword(!showConfirmPassword), showConfirmPassword)}

          {/* Error message display */}
          {errorMsg.length > 0 && <Text style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</Text>}

          {/* Remember me and forgot password (login only) */}
          {isLogin && (
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity style={styles.rememberContainer} onPress={() => setRemember(!remember)}>
                <View style={[styles.checkbox, remember && styles.checkedBox]}>
                  {remember && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit button for login/signup */}
          <TouchableOpacity
            style={[styles.submitButton, (loadingLogin || loadingSignup) && styles.disabledButton]}
            onPress={isLogin ? handleLogin : handleSignUp}
            disabled={loadingLogin || loadingSignup}
          >
            {(loadingLogin || loadingSignup) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider and social login buttons (UI only) */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={20} color="#4267B2" />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="apple" size={20} color="#000" />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading overlay while authenticating */}
      {(loadingLogin || loadingSignup) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F00" />
            <Text style={styles.loadingText}>Please wait...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Login;

// Styles for Login screen components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D2B',
  },

  headerSection: {
    height: height * 0.27,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 20,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 4,
    marginBottom: 30,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  activeTabButton: {
    backgroundColor: '#FF6F00',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  activeTabText: {
    color: '#fff',
  },

  formFields: {
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  inputIcon: {
    marginRight: 12,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  eyeButton: {
    padding: 8,
  },

  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkedBox: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },

  rememberText: {
    fontSize: 14,
    color: '#666',
  },

  forgotText: {
    fontSize: 14,
    color: '#FF6F00',
    fontWeight: '600',
  },

  submitButton: {
    backgroundColor: '#FF6F00',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },

  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#999',
  },

  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

