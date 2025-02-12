import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalStateProvider } from './components/GlobalStateContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <GlobalStateProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </GestureHandlerRootView>
    </GlobalStateProvider>
  );
}
