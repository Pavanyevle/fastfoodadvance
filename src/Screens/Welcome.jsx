import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

// Get device width and height for responsive UI
const { width, height } = Dimensions.get('window');

/**
 * Welcome Screen
 * Entry screen for the app.
 * Features:
 * - Shows app illustration/banner
 * - "Get Started" button navigates to Login screen
 * - Social login buttons (UI only)
 * - Link to Sign Up (navigates to Login for registration)
 */
const Welcome = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top section: App illustration/banner image */}
      <ImageBackground
        source={require('../img/1.png')}
        style={styles.topSection}
        resizeMode="cover"
      />
      {/* Gradient overlay for smooth transition to bottom section */}
      <LinearGradient colors={['#ffffff00', '#ffffff']} style={styles.gradient}>
        <View style={styles.bottomSection}>
          {/* Get Started button */}
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          {/* Divider for social sign in */}
          <Text style={styles.signInWith}>
            ------------------ Sign in with ------------------
          </Text>
          {/* Social login buttons (UI only) */}
          <View style={styles.socialButtonsContainer}>
            <SocialButton icon="google" color="#EA4335" label="Google" />
            <SocialButton icon="facebook" color="#4267B2" label="Facebook" />
            <SocialButton icon="apple" color="#000" label="Apple" />
          </View>
          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

/**
 * SocialButton
 * Renders a social login button with icon and label
 * (UI only, no actual authentication logic)
 */
const SocialButton = ({ icon, color, label }) => (
  <TouchableOpacity style={styles.socialButton}>
    <FontAwesome name={icon} size={20} color={color} />
    <Text style={styles.socialButtonText}>{label}</Text>
  </TouchableOpacity>
);

export default Welcome;

// Styles for Welcome screen UI components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topSection: {
    height: height * 0.76,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },

  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  bottomSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  getStartedBtn: {
    backgroundColor: '#FF5B00',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 28,
    width: '100%',
    alignItems: 'center',
  },

  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  signInWith: {
    color: '#222',
    fontSize: 16,
    marginBottom: 16,
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

  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  signupText: {
    color: '#888',
    fontSize: 15,
  },

  signupLink: {
    color: '#FF5B00',
    fontWeight: 'bold',
    fontSize: 15,
  },
});