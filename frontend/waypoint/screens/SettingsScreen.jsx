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

import data from '../utils/defaults/assets.js';
import { getData, storeData } from '../utils/asyncStorage';
import { storeSyncedData, getSyncedData } from '../utils/syncStorage';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { API_URL, uploadFile } from '../utils/utils';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { currentUser, setCurrentUser } = useGlobalState();
  
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState('miles'); // 'miles' or 'kilometers'

  useEffect(() => {
    loadUserData();
    checkPermissions();
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Reset profile image state to ensure we don't show previous user's image
      setProfileImage(null);
      
      // Get username from local storage (not synced)
      const username = await getData('username');
      if (username) {
        setUsername(username);
      }
      
      // Initialize settings if they don't exist yet
      const userData = await getData('user');
      let token = null;
      
      if (userData) {
        token = userData.token;
        
        // If we have a token but no settings yet, create default settings
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
        
        // Force fetch profile picture from server to ensure we have the latest
        try {
          console.log('Fetching profile picture for current user from server');
          const profilePicData = await getSyncedData('profilePicture', true); // Force sync from server
          
          if (profilePicData && profilePicData.imageUri) {
            console.log('Setting profile image from server data');
            setProfileImage(profilePicData.imageUri);
          } else if (userData.profilePicture) {
            console.log('Setting profile image from user data');
            setProfileImage(userData.profilePicture);
          } else {
            console.log('No profile image found for current user');
            setProfileImage(null);
          }
        } catch (error) {
          console.error('Error fetching profile picture:', error);
          // Fallback to user data if available
          if (userData.profilePicture) {
            setProfileImage(userData.profilePicture);
          }
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

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload a profile picture!',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setProfileImage(selectedImage.uri);
        
        // Upload image to server
        uploadProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setIsLoading(true);
      
      // Get user data
      const userData = await getData('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      if (!userData.token) {
        throw new Error('User token not found');
      }

      // Hybrid storage approach:
      // 1. Update local user data with profile picture
      // 2. Store profile picture separately for syncing with server
      try {
        console.log('Starting profile picture upload process');
        console.log('Image URI:', imageUri.substring(0, 50) + '...');
        
        // Create updated user data with the new profile picture
        const updatedUserData = {
          ...userData,
          profilePicture: imageUri,
        };
        
        // Store the updated user data locally
        const storeResult = await storeData('user', updatedUserData);
        console.log('Local user data update result:', storeResult);
        
        // Store profile picture separately for syncing with server
        console.log('Attempting to sync profile picture with server');
        const syncResult = await storeSyncedData('profilePicture', {
          username: userData.username || username,
          imageUri: imageUri,
          timestamp: new Date().toISOString()
        }, true); // Try to sync immediately if online
        
        console.log('Profile picture sync result:', syncResult);
        
        if (syncResult.error) {
          console.warn('Warning: Profile picture sync returned error:', syncResult.message);
          // Still show success since we saved locally
          Alert.alert('Partial Success', 'Profile picture saved locally but could not be synced with the server. It will sync when you reconnect.');
        } else {
          console.log('Profile picture updated successfully!');
        }
      } catch (e) {
        console.error('Error updating profile image:', e);
        throw new Error('Failed to update profile picture: ' + (e.message || e));
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
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
    
    // Here you would also apply the dark mode theme to your app
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
      
      // Sync profile picture with server
      if (userData.profilePicture) {
        try {
          console.log('Syncing profile picture with server');
          console.log('Profile picture URI:', userData.profilePicture.substring(0, 50) + '...');
          console.log('Username:', userData.username || username);
          
          // Store profile picture for syncing with server
          const syncResult = await storeSyncedData('profilePicture', {
            username: userData.username || username,
            imageUri: userData.profilePicture,
            timestamp: new Date().toISOString()
          }, true); // Try to sync immediately
          
          console.log('Profile picture sync result:', syncResult);
          
          if (syncResult.error) {
            console.warn('Profile picture sync returned error:', syncResult.message);
          } else {
            console.log('Profile picture synced successfully');
          }
        } catch (picError) {
          console.error('Error syncing profile picture:', picError);
          // Continue with other syncs even if profile picture sync fails
        }
      }
      
      // Update the last sync times for all data types
      const now = Date.now();
      const syncTimes = await getData('syncTimes') || {};
      
      // Update sync times for all data types
      syncTimes.user = now;
      syncTimes.settings = now;
      syncTimes.friends = now;
      syncTimes.profilePicture = now;
      
      await storeData('syncTimes', syncTimes);
      
      Alert.alert('Success', 'Settings and profile data synced successfully!');
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
            onPress={pickImage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={data.colors.primaryColor} />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Image source={data.images.defaultAvatar} style={styles.defaultProfileImage} />
              </View>
            )}
            {!profileImage && (
              <View style={styles.plusIconContainer}>
                <Icon2 name="add" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.editProfileText}>Tap to {profileImage ? 'change' : 'add'} profile picture</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: data.colors.primaryColor,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    borderRadius: 60,
  },
});

export default SettingsScreen; 