import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ProfileSettingsScreen = ({ navigation, route }) => {
  const { username } = route.params;
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  

  const handleDeleteAccount = () => {
    setDeleteModal(true);
  };

  const handleLogout = () => {
  setLogoutModal(true);
};


const pickImageFromGallery = async () => {
  try {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);  // बस UI के लिए hold करो
    }
  } catch (err) {
    console.error("Image picker error:", err);
  }
};

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      await axios.delete(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`
      );

      setIsDeleting(false);
      setDeleteModal(false);

      setMessageModal({
        visible: true,
        type: 'success',
        message: 'Account deleted successfully!',
      });

     
      setTimeout(() => {
        AsyncStorage.removeItem('username');
        AsyncStorage.removeItem('address');
        navigation.navigate('Welcome');
      }, 1500);

    } catch (error) {
      console.error('Account deletion error:', error);
      setIsDeleting(false);
      setDeleteModal(false);

      setMessageModal({
        visible: true,
        type: 'error',
        message: 'Failed to delete account!',
      });
    }
  };
  const [messageModal, setMessageModal] = useState({
    visible: false,
    type: '',
    message: '',
  });

  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, City, State 12345',
  });

  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    locationServices: true,
    biometricAuth: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({ ...profileData });

  useEffect(() => {
   const fetchUserData = async () => {
  try {
    const res = await axios.get(
      `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`
    );

    if (res.data) {
      setProfileData({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        image: res.data.image || '', // ✅ इथे image field add कर
      });

      setTempData({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
    } else {
      Alert.alert('Error', 'User data not found!');
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    Alert.alert('Error', 'Failed to fetch user data');
  }
};

    fetchUserData();
  }, []);

  

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
  };

  
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill all fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      // 🔍 Step 1: Fetch user data from Realtime DB
      const res = await axios.get(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`
      );

      if (res.data && res.data.password === currentPassword) {
        // ✅ Step 2: Update password in DB
        await axios.patch(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`,
          {
            password: newPassword,
            passwordUpdatedAt: new Date().toISOString(),
          }
        );

        setPasswordError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setMessageModal({
          visible: true,
          type: 'success',
          message: 'Password updated successfully!',
        });

      } else {
        setPasswordError('Current password is incorrect');
      }
    } catch (err) {
      console.error('Error:', err);
      setPasswordError('Something went wrong');
    }
  };

const handleSave = async () => {
  try {
    const updatedData = { ...tempData };

    // अगर user ने image बदली है
    if (selectedImage) {
      updatedData.image = selectedImage;
    }

    await axios.patch(
      `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`,
      updatedData
    );

    setProfileData(prev => ({
      ...updatedData,
      image: selectedImage || prev.image,  // जो दिख रही थी वही रखो
    }));

    setIsEditing(false);
    setSelectedImage(null); // reset after save

    setMessageModal({
      visible: true,
      type: 'success',
      message: 'Profile updated successfully!',
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    setMessageModal({
      visible: true,
      type: 'error',
      message: 'Failed to update profile.',
    });
  }
};



  const renderProfileHeader = () => (
  <View style={styles.profileHeader}>
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.profileGradient}>
      
      {/* Profile Image (Just Display) */}
      <Image
        source={
          selectedImage
            ? { uri: selectedImage }
            : profileData.image
            ? { uri: profileData.image }
            : require('../img/profile.png')
        }
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 2,
          borderColor: '#fff',
          alignSelf: 'center',
          marginBottom: 10,
        }}
      />

      {/* "Change Profile Image" Text - Clickable */}
      {isEditing && (
        <TouchableOpacity onPress={pickImageFromGallery}>
          <Text style={{
            color: '#fff',
            textDecorationLine: 'underline',
            fontSize: 14,
            marginBottom: 10,
          }}>
            Change Profile Image
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.profileName}>{username}</Text>
      <Text style={styles.profileEmail}>{profileData.email}</Text>
    </LinearGradient>
  </View>
);

  const renderPersonalInfo = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Icon name={isEditing ? "close" : "create"} size={20} color="#6366f1" />
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.section, styles.infoCard]}>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputWrapper}>
            <Icon name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={username}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={isEditing ? tempData.email : profileData.email}
              onChangeText={(text) => setTempData({ ...tempData, email: text })}
              editable={isEditing}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address</Text>
          <View style={styles.inputWrapper}>
            <Icon name="location-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={isEditing ? tempData.address : profileData.address}
              onChangeText={(text) => setTempData({ ...tempData, address: text })}
              editable={isEditing}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
  const renderSettingsSection = () => (
    <View style={styles.section}>

    </View>
  );

  const renderAccountActions = () => (
    <View>
      <Text style={styles.sectionTitle}>Account</Text>

      <View style={[styles.section, styles.actionsCard]}>

        <TouchableOpacity style={styles.actionItem} onPress={() => setPasswordModal(true)}>
          <View style={styles.actionInfo}>
            <Icon name="lock-closed-outline" size={24} color="#6366f1" />
            <Text style={styles.actionTitle}>Change Password</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionInfo}>
            <Icon name="help-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.actionTitle}>Help & Support</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionInfo}>
            <Icon name="information-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.actionTitle}>About App</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
  const renderDangerZone = () => (
    <View>
      <Text style={styles.sectionTitle}>Danger Zone</Text>

      <View style={[styles.section, styles.dangerCard]}>

        <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
          <View style={styles.dangerInfo}>
            <Icon name="log-out-outline" size={24} color="#dc2626" />
            <Text style={styles.dangerTitle}>Logout</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
          <View style={styles.dangerInfo}>
            <Icon name="trash-outline" size={24} color="#dc2626" />
            <Text style={styles.dangerTitle}>Delete Account</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      <LinearGradient
        colors={['#1e293b', '#334155']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderPersonalInfo()}
        {renderSettingsSection()}
        {renderAccountActions()}
        {renderDangerZone()}
      </ScrollView>
      {messageModal.visible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {messageModal.type === 'success' ? 'Success' : 'Error'}
            </Text>
            <Text style={styles.modalMessage}>{messageModal.message}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#6366f1', marginTop: 15 }]}
              onPress={() => setMessageModal({ ...messageModal, visible: false })}
            >
              <Text style={{ color: '#fff' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {deleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone. Are you sure you want to delete your account?
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e5e7eb', marginRight: 10 }]}
                onPress={() => setDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={{ color: '#1e293b' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, {
                  backgroundColor: '#dc2626',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 20
                }]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff' }}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {passwordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={{ position: 'relative', width: '100%' }}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, top: 22 }}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View style={{ position: 'relative', width: '100%' }}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, top: 22 }}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Icon
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>


            <View style={{ position: 'relative', width: '100%' }}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 15, top: 22 }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>



           
            {passwordError ? (
              <Text style={{ color: '#dc2626', fontSize: 14, marginTop: 10 }}>
                {passwordError}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e5e7eb', marginRight: 10 }]}
                onPress={() => {
                  setNewPassword('');
                  setPasswordError('');
                  setPasswordModal(false);
                }}
              >
                <Text style={{ color: '#1e293b' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, {
                  backgroundColor: '#6366f1',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 20,
                }]}
                onPress={async () => {
                  if (!newPassword || newPassword.length < 6) {
                    setPasswordError('Password must be at least 6 characters long.');
                    return;
                  }

                  setPasswordError('');
                  setPasswordModal(false);
                  setLoading(true);

                  try {
                    await axios.patch(
                      `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`,
                      { password: newPassword }
                    );

                    setNewPassword('');
                    setLoading(false);

                    setMessageModal({
                      visible: true,
                      type: 'success',
                      message: 'Password updated successfully!',
                    });

                  } catch (err) {
                    console.error('Password update error:', err);
                    setLoading(false);
                    setMessageModal({
                      visible: true,
                      type: 'error',
                      message: 'Failed to update password!',
                    });
                  }
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff' }}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {passwordError ? (
        <Text style={{ color: '#dc2626', fontSize: 14, marginTop: 10 }}>
          {passwordError}
        </Text>
      ) : null}




{logoutModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Logout</Text>
      <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>

      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: '#e5e7eb', marginRight: 10 }]}
          onPress={() => setLogoutModal(false)}
        >
          <Text style={{ color: '#1e293b' }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalBtn, {
            backgroundColor: '#dc2626',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20
          }]}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('username');
              await AsyncStorage.removeItem('address');
              setLogoutModal(false);
              navigation.replace('Welcome');
            } catch (err) {
              console.error('Logout error:', err);
              setLogoutModal(false);
            }
          }}
        >
          <Text style={{ color: '#fff' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 30,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    marginLeft: 8,
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 16,
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dangerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  passwordInput: {
    width: '100%',
    marginTop: 10,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    color: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f1f5f9',
  },


});

export default ProfileSettingsScreen; 