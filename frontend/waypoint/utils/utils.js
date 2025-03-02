import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import { LOCAL_HOST } from '@env';

// API configuration
// Provide fallback in case env variable isn't loaded
const serverHost = LOCAL_HOST || '100.64.43.38:3010';
export const API_URL = `http://${serverHost}`;

// Log the API URL for debugging
console.log(`API configured with URL: ${API_URL}`);

let storedData = [];

export const cleanupData = async () => {
    for (let i = 0; i < storedData.length; i++) {
        try {
            await AsyncStorage.removeItem(storedData[i]);
        } catch (e) {
            
        }
    }
}

export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(String(key), String(value));
        storedData.push(String(key));
        return { error: false, message: "Created successfully." }
    } catch (e) {
        return { error: true, message: "Error writing to key." }
    }
};

export const getData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(String(key));
        if (value !== null) {
            return { error: false, data: value, message: "Success." }
        } else {
            return { error: true, message: "No data for that key." }
        }
    } catch (e) {
        return { error: true, message: "Error reading key." }
    }
};

export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(String(key));
        return { error: false, message: "Deleted successfully." };
    } catch (e) {
        return { error: true, message: "Error deleting key." };
    }
};

// Generic API request function with authentication
export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    console.log(`API Request to ${API_URL}/${endpoint}`);
    
    const response = await fetch(`${API_URL}/${endpoint}`, config);
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle non-JSON response
      const textResponse = await response.text();
      console.warn(`Received non-JSON response from ${endpoint}:`, textResponse.substring(0, 150) + '...');
      responseData = { message: 'Server returned non-JSON response' };
    }

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      error: !response.ok,
      message: response.ok ? "Request successful." : `Returned with error code: ${response.status}`
    };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      status: 500,
      ok: false,
      error: true,
      data: null,
      message: `Returned with error: ${error.message || error}`
    };
  }
};

// Advanced HTTP method helpers
export const get = async (endpoint, token = null) => {
  return apiRequest(endpoint, 'GET', null, token);
};

export const post = async (endpoint, data, token = null) => {
  return apiRequest(endpoint, 'POST', data, token);
};

export const put = async (endpoint, data, token = null) => {
  return apiRequest(endpoint, 'PUT', data, token);
};

export const patch = async (endpoint, data, token = null) => {
  return apiRequest(endpoint, 'PATCH', data, token);
};

export const del = async (endpoint, token = null) => {
  return apiRequest(endpoint, 'DELETE', null, token);
};

// Legacy API functions (maintained for backward compatibility)
export const getRequest = async (address) => {
    try {
        console.log(`Making GET to ${address} @ ${API_URL}`)

        const res = await fetch(`${API_URL}/${address}`, {
            method: 'get',
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        // Check if the response is JSON
        const contentType = res.headers.get('content-type');
        let reqData;
        
        if (contentType && contentType.includes('application/json')) {
            reqData = await res.json();
        } else {
            // Handle non-JSON response
            const textResponse = await res.text();
            console.warn(`Received non-JSON response from ${address}:`, textResponse.substring(0, 150) + '...');
            reqData = { message: 'Server returned non-JSON response' };
        }
    
        if (res.ok) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`};
    }
};

export const postRequest = async (address, data={}) => {
    try {
        console.log(`Making POST to ${address} @ ${API_URL}`)

        const res = await fetch(`${API_URL}/${address}`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                data
            )
        });

        // Check if the response is JSON
        const contentType = res.headers.get('content-type');
        let reqData;
        
        if (contentType && contentType.includes('application/json')) {
            reqData = await res.json();
        } else {
            // Handle non-JSON response
            const textResponse = await res.text();
            console.warn(`Received non-JSON response from ${address}:`, textResponse.substring(0, 150) + '...');
            reqData = { message: 'Server returned non-JSON response' };
        }
    
        if (res.ok) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`};
    }
};

// File upload helper
export const uploadFile = async (endpoint, fileUri, fileType, fileName, additionalData = {}, token = null) => {
  try {
    const formData = new FormData();
    
    // Append the file
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    });
    
    // Append any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`Uploading file to ${API_URL}/${endpoint}`);
    
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle non-JSON response
      const textResponse = await response.text();
      console.warn(`Received non-JSON response from ${endpoint}:`, textResponse.substring(0, 150) + (textResponse.length > 150 ? '...' : ''));
      console.warn(`Response status: ${response.status}, Content-Type: ${contentType || 'not specified'}`);
      responseData = { 
        message: 'Server returned non-JSON response',
        rawResponse: textResponse.substring(0, 100) + (textResponse.length > 100 ? '...' : '')
      };
    }
    
    return {
      status: response.status,
      ok: response.ok,
      error: !response.ok,
      data: responseData,
      message: response.ok ? "Upload successful." : `Upload failed with status: ${response.status}`
    };
  } catch (error) {
    console.error(`Upload Error (${endpoint}):`, error);
    return {
      status: 500,
      ok: false,
      error: true,
      data: null,
      message: `Upload error: ${error.message || error}`
    };
  }
};

export const storeKeychainData = async (username, password) => {
    try {
        if (!Keychain || !Keychain.setGenericPassword) {
            throw new Error("Keychain module is not properly initialized.");
        }
        
        await Keychain.setGenericPassword(username, password);
        return { error: false, message: "Credentials stored successfully." };
    } catch (e) {
        //console.error("Keychain storage error:", e);
        return { error: true, message: e.message || "Failed to store credentials." };
    }
};

export const getKeychainData = async () => {
    try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            return { error: false, data: credentials, message: "Credentials retrieved." };
        } else {
            return { error: true, message: "No credentials stored." };
        }
    } catch (e) {
        return { error: true, data: e, message: "Error reading credentials." };
    }
};

export const removeKeychainData = async () => {
    try {
        await Keychain.resetGenericPassword();
        return { error: false, message: "Credentials deleted successfully." };
    } catch (e) {
        return { error: true, data: e, message: "Error deleting credentials." };
    }
};

export const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
