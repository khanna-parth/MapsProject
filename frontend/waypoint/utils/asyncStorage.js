import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store data in AsyncStorage
 * This version supports storing objects and arrays by automatically stringifying them
 * 
 * @param {string} key - The key to store the data under
 * @param {any} value - The value to store (can be string, object, array, etc.)
 * @returns {Promise<Object>} - Result object with error status and message
 */
export const storeData = async (key, value) => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(String(key), jsonValue);
    return { error: false, message: "Stored successfully." };
  } catch (e) {
    console.error('Storage error:', e);
    return { error: true, message: "Error storing data." };
  }
};

/**
 * Retrieve data from AsyncStorage
 * This version automatically parses JSON data if it was stored as an object
 * 
 * @param {string} key - The key to retrieve data from
 * @returns {Promise<Object>} - Result object with error status, data, and message
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(String(key));
    
    if (jsonValue === null) {
      return null;
    }
    
    try {
      // Try to parse as JSON
      return JSON.parse(jsonValue);
    } catch {
      // If parsing fails, return as string
      return jsonValue;
    }
  } catch (e) {
    console.error('Retrieval error:', e);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 * 
 * @param {string} key - The key to remove
 * @returns {Promise<Object>} - Result object with error status and message
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(String(key));
    return { error: false, message: "Removed successfully." };
  } catch (e) {
    console.error('Removal error:', e);
    return { error: true, message: "Error removing data." };
  }
};

/**
 * Clear all data from AsyncStorage
 * 
 * @returns {Promise<Object>} - Result object with error status and message
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return { error: false, message: "All data cleared successfully." };
  } catch (e) {
    console.error('Clear error:', e);
    return { error: true, message: "Error clearing data." };
  }
};

/**
 * Get all keys stored in AsyncStorage
 * 
 * @returns {Promise<Array|null>} - Array of keys or null if error
 */
export const getAllKeys = async () => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (e) {
    console.error('GetAllKeys error:', e);
    return null;
  }
};

/**
 * Get multiple items from AsyncStorage by their keys
 * 
 * @param {Array} keys - Array of keys to retrieve
 * @returns {Promise<Object|null>} - Object with key-value pairs or null if error
 */
export const getMultiple = async (keys) => {
  try {
    const result = await AsyncStorage.multiGet(keys);
    
    return result.reduce((acc, [key, value]) => {
      try {
        acc[key] = JSON.parse(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch (e) {
    console.error('GetMultiple error:', e);
    return null;
  }
};

/**
 * Clear all keys that start with a specific prefix
 * 
 * @param {string} prefix - The prefix to match keys against
 * @returns {Promise<Object>} - Result object with error status, count of cleared items, and message
 */
export const clearKeysWithPrefix = async (prefix) => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => key.startsWith(prefix));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Cleared ${keysToRemove.length} items with prefix "${prefix}"`);
      return { 
        error: false, 
        count: keysToRemove.length,
        message: `Cleared ${keysToRemove.length} items with prefix "${prefix}"` 
      };
    }
    
    return { error: false, count: 0, message: `No items found with prefix "${prefix}"` };
  } catch (e) {
    console.error(`Error clearing keys with prefix "${prefix}":`, e);
    return { error: true, message: `Error clearing keys with prefix "${prefix}"` };
  }
}; 