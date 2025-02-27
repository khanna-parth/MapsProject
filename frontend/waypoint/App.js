import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalStateProvider } from './components/global/GlobalStateContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
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
