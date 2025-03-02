import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalStateProvider } from './components/global/GlobalStateContext';
import AppNavigator from './navigation/AppNavigator';
import { useEffect } from 'react';
import { initSync, startPeriodicSync, stopPeriodicSync } from './utils/syncStorage';
import { getData } from './utils/asyncStorage';

// Initialize sync system
const initializeSync = async () => {
  try {
    // Check if user is authenticated before starting sync
    const userData = await getData('user');
    
    // Initialize the sync system regardless of authentication
    await initSync();
    
    // Since all data is now local-only, we don't need to start periodic sync
    // But we'll keep the code structure in case we add server sync in the future
    if (userData && userData.token) {
      console.log('User authenticated, but all data is local-only');
      // We're not starting periodic sync since all data is local-only
      stopPeriodicSync();
    } else {
      console.log('User not authenticated, all data is local-only');
      stopPeriodicSync();
    }
    
    console.log('Sync system initialized for local storage only');
  } catch (error) {
    console.error('Failed to initialize sync system:', error);
  }
};

export default function App() {
  // Initialize sync when app starts
  useEffect(() => {
    initializeSync();
    
    // Clean up sync interval when app is closed
    return () => {
      if (global.syncInterval) {
        clearInterval(global.syncInterval);
      }
    };
  }, []);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <GlobalStateProvider>
          <AppNavigator />
        </GlobalStateProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
