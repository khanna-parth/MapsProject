import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    </GestureHandlerRootView>
  );
}
