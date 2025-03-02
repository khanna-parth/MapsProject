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

import data from '../utils/defaults/assets.js';
import { getData, storeData } from '../utils/asyncStorage';
import { storeSyncedData, getSyncedData } from '../utils/syncStorage';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { API_URL } from '../utils/utils';

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
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Reset profile image state
      setProfileImage(null);
      
      // Get username from local storage (not synced)
      const username = await getData('username');
      if (username) {
        setUsername(username);
      }
      
      // Initialize settings if they don't exist yet
      const userData = await getData('user');
      
      if (userData) {
        // If we have user data but no settings yet, create default settings
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

  const showProfilePictureDisabledMessage = () => {
    Alert.alert(
      'Feature Disabled',
      'Profile picture upload is currently disabled due to server limitations. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
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
      
      // Update the last sync times for all data types
      const now = Date.now();
      const syncTimes = await getData('syncTimes') || {};
      
      // Update sync times for all data types
      syncTimes.user = now;
      syncTimes.settings = now;
      syncTimes.friends = now;
      
      await storeData('syncTimes', syncTimes);
      
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
            onPress={showProfilePictureDisabledMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={data.colors.primaryColor} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Image source={data.images.defaultAvatar} style={styles.defaultProfileImage} />
              </View>
            )}
            <View style={styles.disabledPlusIconContainer}>
              <Icon2 name="block" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.editProfileText}>Profile picture upload disabled</Text>
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
  disabledPlusIconContainer: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#999',
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