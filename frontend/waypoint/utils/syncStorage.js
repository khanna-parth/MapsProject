import { getData, storeData } from './asyncStorage';
import { post, get, put, API_URL } from './utils';
import NetInfo from '@react-native-community/netinfo';

/**
 * Utility for managing synchronized storage between local device and server
 */

// Configuration for which data should be synced
const SYNC_CONFIG = {
  settings: {
    endpoint: null, // No server endpoint for settings, store locally only
    syncInterval: 60000, // 1 minute
    priority: 'local', // 'local' or 'server' - which takes precedence on conflict
    localOnly: true // Flag to indicate this should only be stored locally
  },
  user: {
    endpoint: 'user/profile', // Endpoint for user profile data
    syncInterval: 300000, // 5 minutes
    priority: 'local',
    localOnly: false // Enable server syncing for user profile
  },
  friends: {
    endpoint: null, // Server endpoint not working properly, store locally only
    syncInterval: 600000, // 10 minutes
    priority: 'local',
    localOnly: true // Flag to indicate this should only be stored locally
  },
  profilePicture: {
    endpoint: 'user/profile-picture', // Endpoint for profile picture
    syncInterval: 300000, // 5 minutes
    priority: 'local',
    localOnly: false // Enable server syncing for profile pictures
  }
};

// Track last sync times
let lastSyncTimes = {};

/**
 * Initialize the sync system
 */
export const initSync = async () => {
  // Load last sync times from storage
  try {
    const storedTimes = await getData('syncTimes');
    if (storedTimes) {
      lastSyncTimes = storedTimes;
    } else {
      lastSyncTimes = {};
    }
  } catch (error) {
    console.error('Error loading sync times:', error);
    lastSyncTimes = {};
  }

  // Set up network change listener
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // When connection is restored, sync pending changes
      syncPendingChanges();
    }
  });
};

/**
 * Store data both locally and mark for server sync
 * 
 * @param {string} key - Storage key (must be defined in SYNC_CONFIG)
 * @param {any} value - Data to store
 * @param {boolean} syncNow - Whether to attempt immediate sync with server
 * @returns {Promise<Object>} - Result of the operation
 */
export const storeSyncedData = async (key, value, syncNow = false) => {
  try {
    // Check if this is a friend profile picture request
    if (key.startsWith('profilePicture_')) {
      const username = key.replace('profilePicture_', '');
      // Create a dynamic config for this friend's profile picture
      SYNC_CONFIG[key] = createFriendProfilePictureConfig(username);
    }
    
    // Validate the key is configured for syncing
    if (!SYNC_CONFIG[key]) {
      console.warn(`Key "${key}" is not configured for syncing. Using local storage only.`);
      return storeData(key, value);
    }

    // Add sync metadata
    const dataToStore = {
      ...value,
      _lastModified: new Date().toISOString(),
      _needsSync: !SYNC_CONFIG[key].localOnly && SYNC_CONFIG[key].endpoint !== null, // Only mark for sync if not local-only
    };

    // Store locally
    const storeResult = await storeData(key, dataToStore);
    
    // Attempt immediate sync if requested and online and not local-only
    if (syncNow && !SYNC_CONFIG[key].localOnly && SYNC_CONFIG[key].endpoint) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await syncData(key);
      }
    }

    return storeResult;
  } catch (error) {
    console.error(`Error in storeSyncedData for key ${key}:`, error);
    return { error: true, message: error.message };
  }
};

/**
 * Get data with sync awareness - will attempt to sync with server if needed
 * 
 * @param {string} key - Storage key
 * @param {boolean} forceSync - Whether to force a sync with server before returning
 * @returns {Promise<any>} - The data
 */
export const getSyncedData = async (key, forceSync = false) => {
  try {
    // Check if this is a friend profile picture request
    if (key.startsWith('profilePicture_')) {
      const username = key.replace('profilePicture_', '');
      // Create a dynamic config for this friend's profile picture
      SYNC_CONFIG[key] = createFriendProfilePictureConfig(username);
    }
    
    // Check if this key is configured for syncing
    if (!SYNC_CONFIG[key]) {
      console.warn(`Key "${key}" is not configured for syncing. Using local storage only.`);
      return getData(key);
    }

    // For local-only data, just return the local data without syncing
    if (SYNC_CONFIG[key].localOnly || !SYNC_CONFIG[key].endpoint) {
      return getData(key);
    }

    // Check if we need to sync from server
    const shouldSync = forceSync || shouldSyncFromServer(key);
    
    if (shouldSync) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await syncData(key);
      }
    }
    
    // Return local data
    return getData(key);
  } catch (error) {
    console.error(`Error in getSyncedData for key ${key}:`, error);
    return null;
  }
};

/**
 * Determine if we should sync from server based on time elapsed
 */
const shouldSyncFromServer = (key) => {
  if (!SYNC_CONFIG[key]) return false;
  
  const now = Date.now();
  const lastSync = lastSyncTimes[key] || 0;
  const elapsed = now - lastSync;
  
  return elapsed > SYNC_CONFIG[key].syncInterval;
};

/**
 * Sync a specific data key with the server
 */
export const syncData = async (key) => {
  try {
    if (!SYNC_CONFIG[key]) {
      console.warn(`Cannot sync key "${key}" - not configured for syncing.`);
      return { error: true, message: 'Key not configured for syncing' };
    }

    const config = SYNC_CONFIG[key];
    
    // If this is a local-only setting or has no endpoint, skip server sync
    if (config.localOnly || !config.endpoint) {
      console.log(`Skipping server sync for local-only key: ${key}`);
      
      // Update last sync time
      lastSyncTimes[key] = Date.now();
      await storeData('syncTimes', lastSyncTimes);
      
      return { error: false, message: `${key} is local-only, no server sync needed` };
    }

    // Check network connectivity first
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.warn(`Cannot sync ${key} - no network connection`);
      return { error: true, message: 'No network connection' };
    }
    
    // Get local data
    const localData = await getData(key);
    
    // Get user token for authentication
    const userData = await getData('user');
    let token = null;
    
    if (userData) {
      token = userData.token;
    }
    
    if (!token) {
      console.warn('Cannot sync - user not authenticated');
      return { error: true, message: 'User not authenticated' };
    }

    // If local data needs sync, push to server
    if (localData && localData._needsSync) {
      try {
        // Remove sync metadata before sending
        const { _needsSync, _lastModified, ...dataToSync } = localData;
        
        // Use POST for profile picture endpoint, PUT for others
        let response;
        if (key === 'profilePicture') {
          response = await post(config.endpoint, dataToSync, token);
        } else {
          response = await put(config.endpoint, dataToSync, token);
        }
        
        if (response.ok) {
          // Update local data to mark as synced
          localData._needsSync = false;
          await storeData(key, localData);
        } else {
          console.error(`Error syncing ${key} to server:`, response.error || response.data);
        }
      } catch (error) {
        console.error(`Network error syncing ${key} to server:`, error);
        return { error: true, message: `Network error: ${error.message}` };
      }
    } 
    // Otherwise pull from server if using server priority
    else if (config.priority === 'server') {
      try {
        const response = await get(config.endpoint, token);
        
        if (response.ok && response.data) {
          // Merge with local data, keeping server as priority
          const mergedData = {
            ...(localData || {}),
            ...response.data,
            _needsSync: false,
            _lastModified: new Date().toISOString(),
          };
          
          await storeData(key, mergedData);
        }
      } catch (error) {
        console.error(`Network error getting ${key} from server:`, error);
        return { error: true, message: `Network error: ${error.message}` };
      }
    }
    
    // Update last sync time
    lastSyncTimes[key] = Date.now();
    await storeData('syncTimes', lastSyncTimes);
    
    return { error: false, message: `Successfully synced ${key}` };
  } catch (error) {
    console.error(`Error syncing ${key}:`, error);
    return { error: true, message: error.message };
  }
};

/**
 * Sync all pending changes to server
 */
export const syncPendingChanges = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.warn('Cannot sync - no network connection');
      return { error: true, message: 'No internet connection' };
    }
    
    // Check if user is authenticated
    const userData = await getData('user');
    if (!userData) {
      console.warn('Cannot sync - user not authenticated');
      return { error: true, message: 'User not authenticated' };
    }
    
    if (!userData.token) {
      console.warn('Cannot sync - user token not found');
      return { error: true, message: 'User token not found' };
    }
    
    const results = {};
    let hasErrors = false;
    
    // Sync each configured key
    for (const key of Object.keys(SYNC_CONFIG)) {
      try {
        // Skip server sync for localOnly items or items without an endpoint
        if (SYNC_CONFIG[key].localOnly || !SYNC_CONFIG[key].endpoint) {
          console.log(`Skipping server sync for local-only key: ${key}`);
          results[key] = { error: false, message: `${key} is local-only, no server sync needed` };
          continue;
        }
        
        results[key] = await syncData(key);
        if (results[key].error) {
          hasErrors = true;
          console.warn(`Failed to sync ${key}: ${results[key].message}`);
        }
      } catch (error) {
        hasErrors = true;
        results[key] = { error: true, message: error.message };
        console.error(`Error syncing ${key}:`, error);
      }
    }
    
    return { 
      error: hasErrors, 
      data: results, 
      message: hasErrors ? 'Sync completed with some errors' : 'Sync completed successfully' 
    };
  } catch (error) {
    console.error('Error syncing pending changes:', error);
    return { error: true, message: error.message };
  }
};

/**
 * Schedule periodic sync
 * @param {number} interval - Interval in milliseconds
 */
export const startPeriodicSync = (interval = 900000) => { // Default 15 minutes
  // Clear any existing interval
  if (global.syncInterval) {
    clearInterval(global.syncInterval);
  }
  
  // Set up new interval
  global.syncInterval = setInterval(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const result = await syncPendingChanges();
        if (result.error) {
          console.warn(`Periodic sync failed: ${result.message}`);
        } else {
          console.log('Periodic sync completed successfully');
        }
      }
    } catch (error) {
      console.error('Error in periodic sync:', error);
    }
  }, interval);
  
  return global.syncInterval;
};

/**
 * Stop periodic sync
 */
export const stopPeriodicSync = () => {
  if (global.syncInterval) {
    clearInterval(global.syncInterval);
    global.syncInterval = null;
  }
};

// Add dynamic configuration for friend profile pictures
const createFriendProfilePictureConfig = (username) => {
  return {
    endpoint: `user/profile-picture/${username}`, // Endpoint for friend's profile picture
    syncInterval: 600000, // 10 minutes
    priority: 'server', // Server has the most up-to-date profile pictures
    localOnly: false // Enable server syncing
  };
}; 