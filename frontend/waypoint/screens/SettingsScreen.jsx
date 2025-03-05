import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Switch, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import Icon3 from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import data from '../utils/defaults/assets.js';
import { getData, storeData } from '../utils/asyncStorage';
import { storeSyncedData, getSyncedData } from '../utils/syncStorage';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { API_URL } from '../utils/utils';
import { getUserProfilePicture, updateProfilePicture } from '../utils/userUtils';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { currentUser, setCurrentUser } = useGlobalState();
  
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState('miles'); // 'miles' or 'kilometers'

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Reset profile image state
      setProfileImage(null);
      
      // Get username from local storage
      const usernameResult = await getData('username');
      
      // Extract username whether it's an object or string
      let username;
      
      if (typeof usernameResult === 'string') {
        username = usernameResult;
      } 
      else if (usernameResult && !usernameResult.error && usernameResult.data) {
        username = usernameResult.data;
      }
      
      if (username) {
        setUsername(username);
        
        // Try to load profile picture
        try {
          const profilePicResult = await getUserProfilePicture(username);
          if (!profilePicResult.error && profilePicResult.data && profilePicResult.data.imageUri) {
            setProfileImage(profilePicResult.data.imageUri);
          }
        } catch (error) {
          console.error('Error loading profile picture:', error);
        }
      }
      
      // Initialize settings if they don't exist yet
      const userData = await getData('user');
      
      if (userData) {
        const settings = await getSyncedData('settings');
        if (!settings) {
          const defaultSettings = {
            notifications: true,
            locationSharing: true,
            darkMode: false,
            distanceUnit: 'miles'
          };
          
          await storeSyncedData('settings', defaultSettings, true);
        }
      }
      
      // Get settings with sync awareness
      const settings = await getSyncedData('settings');
      if (settings) {
        setNotificationsEnabled(settings.notifications !== false);
        setLocationSharingEnabled(settings.locationSharing !== false);
        setDarkModeEnabled(settings.darkMode === true);
        setDistanceUnit(settings.distanceUnit || 'miles');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Process image by resizing and compressing
  const processImage = async (uri) => {
    try {
      // First try with moderate compression
      let manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600, height: 600 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      // Check if the resulting image is still too large
      let base64Size = manipResult.base64?.length || 0;
      
      // If still too large, compress again more aggressively
      if (base64Size > 2 * 1024 * 1024) {
        manipResult = await ImageManipulator.manipulateAsync(
          manipResult.uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
      }
      
      // Return the base64 encoded image
      return {
        uri: manipResult.uri,
        base64: manipResult.base64,
        width: manipResult.width,
        height: manipResult.height
      };
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error("Failed to process image. Please try again.");
    }
  };

  const handlePickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    
    try {
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      // Verify image was selected
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      
      const selectedAsset = result.assets[0];
      
      if (!selectedAsset.uri) {
        Alert.alert('Error', 'The selected image could not be loaded. Please try again.');
        return;
      }
      
      // Show loading indicator
      setIsUploadingImage(true);
      
      try {
        // Process the image (resize and compress)
        const processedImage = await processImage(selectedAsset.uri);
        
        // Create base64 image URI
        const imageUri = `data:image/jpeg;base64,${processedImage.base64}`;
        
        // Upload the processed image
        await uploadProfilePicture(imageUri);
        
      } catch (error) {
        console.error("Error processing/uploading image:", error);
        Alert.alert('Error', error.message || 'Failed to process image. Please try again.');
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsUploadingImage(false);
    }
  };
  
  const uploadProfilePicture = async (imageUri) => {
    try {
      // Directly get username from storage to ensure it's available
      const usernameResult = await getData('username');
      
      // Extract the username whether it's returned as an object or direct string
      let username;
      
      if (typeof usernameResult === 'string') {
        username = usernameResult;
      } 
      else if (usernameResult && !usernameResult.error && usernameResult.data) {
        username = usernameResult.data;
      }
      
      // Verify we have a valid username
      if (!username) {
        Alert.alert('Error', 'Username not found. Please log in again.');
        return;
      }
      
      // Check if the image is too large for API transmission
      const imageSizeInBytes = imageUri.length * 0.75;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      // If still too large even after processing, show error
      if (imageSizeInMB > 5) {
        Alert.alert(
          'Image Still Too Large',
          'Even after processing, the image is too large. Please try a smaller image.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await updateProfilePicture(username, imageUri);
      
      if (!result.error) {
        setProfileImage(imageUri);
        Alert.alert('Success', 'Profile picture updated successfully.');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile picture.');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    
    // Get current settings
    const settings = await getSyncedData('settings') || {};
    
    // Update and sync
    await storeSyncedData('settings', { 
      ...settings, 
      notifications: value 
    });
  };

  const toggleLocationSharing = async (value) => {
    setLocationSharingEnabled(value);
    
    // Get current settings
    const settings = await getSyncedData('settings') || {};
    
    // Update and sync
    await storeSyncedData('settings', { 
      ...settings, 
      locationSharing: value 
    });
  };

  const toggleDarkMode = async (value) => {
    setDarkModeEnabled(value);
    
    // Get current settings
    const settings = await getSyncedData('settings') || {};
    
    // Update and sync
    await storeSyncedData('settings', { 
      ...settings, 
      darkMode: value 
    });
  };

  const toggleDistanceUnit = async () => {
    const newUnit = distanceUnit === 'miles' ? 'kilometers' : 'miles';
    setDistanceUnit(newUnit);
    
    // Get current settings
    const settings = await getSyncedData('settings') || {};
    
    // Update and sync
    await storeSyncedData('settings', { 
      ...settings, 
      distanceUnit: newUnit 
    });
  };

  const syncAllData = async () => {
    try {
      setIsSyncing(true);
      
      // Check if user is authenticated
      const userData = await getData('user');
      if (!userData) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      if (!userData.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Update the last sync times for all data types
      const now = Date.now();
      const syncTimes = await getData('syncTimes') || {};
      
      // Update sync times for all data types
      syncTimes.user = now;
      syncTimes.settings = now;
      syncTimes.friends = now;
      
      await storeData('syncTimes', syncTimes);
      
      // Reload user data to refresh profile picture
      await loadUserData();
      
      Alert.alert('Success', 'Settings synced successfully!');
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Error', error.message || 'Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={syncAllData}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={data.colors.primaryColor} />
          ) : (
            <Icon name="sync" size={24} color={data.colors.primaryColor} />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={handlePickImage}
            disabled={isLoading || isUploadingImage}
          >
            {isLoading || isUploadingImage ? (
              <ActivityIndicator size="large" color={data.colors.primaryColor} />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Image source={data.images.defaultAvatar} style={styles.defaultProfileImage} />
              </View>
            )}
            <View style={styles.plusIconContainer}>
              <Icon2 name="add" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{username || ''}</Text>
          <Text style={styles.editProfileText}>Tap to change profile picture</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="notifications" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d3d3d3', true: data.colors.primaryColor }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="location-on" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Location Sharing</Text>
            </View>
            <Switch
              value={locationSharingEnabled}
              onValueChange={toggleLocationSharing}
              trackColor={{ false: '#d3d3d3', true: data.colors.primaryColor }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="dark-mode" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#d3d3d3', true: data.colors.primaryColor }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="straighten" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Distance Unit</Text>
            </View>
            <TouchableOpacity onPress={toggleDistanceUnit} style={styles.unitToggle}>
              <Text style={styles.unitToggleText}>
                {distanceUnit === 'miles' ? 'Miles' : 'Kilometers'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="security" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="help" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Icon2 name="info" size={24} color={data.colors.primaryColor} />
              <Text style={styles.settingText}>About</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <View style={styles.syncInfoContainer}>
            <Text style={styles.syncInfoText}>
              Your settings are stored locally on this device. Changes will be saved automatically.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: data.colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: data.colors.primaryColor,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  editProfileText: {
    fontSize: 14,
    color: '#888',
  },
  sectionContainer: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  unitToggle: {
    backgroundColor: data.colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unitToggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  syncInfoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  syncInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
});

export default SettingsScreen; 