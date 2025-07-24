import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.topSection}>
     
        <Text style={styles.title}>Join Us Now</Text>
        <Text style={styles.subtitle}>
          Fill the details below to create your account
        </Text>
      </View>

   
      <View style={styles.formSection}>
        <View style={styles.switchTabs}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.inactiveTabText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, styles.activeTab]}>
            <Text style={styles.activeTabText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconWrapper}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          secureTextEntry={!showPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>Or</Text>

        <View style={styles.socialIconsRow}>
          <TouchableOpacity style={styles.socialCircleBtn}>
            <FontAwesome name="google" size={28} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialCircleBtn}>
            <FontAwesome name="facebook" size={28} color="#4267B2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialCircleBtn}>
            <FontAwesome name="apple" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0D0D2B',
    padding: 0,
  },
  topSection: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: '25%',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 6,
  },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  inactiveTabText: {
    color: '#888',
  },
  label: {
    fontWeight: '500',
    color: '#333',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    height: 48,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    color: '#000',
  },
  eyeIconWrapper: {
    paddingHorizontal: 4,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 12,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 20,
  },
  socialCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
