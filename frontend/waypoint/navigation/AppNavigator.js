import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/Home';
import LoginScreen from '../screens/Login';
import CreateAccountScreen from '../screens/CreateAccount';

import PartyScreen from '../screens/PartyPage';
import InviteScreen from '../screens/Invite';
import SearchScreen from '../screens/Search';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        </Stack.Navigator>
    );
};

const PartyStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Profile" component={PartyScreen} />
        </Stack.Navigator>
    );
};

const InviteStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Invite" component={InviteScreen} />
        </Stack.Navigator>
    );
};

const SearchStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false, }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ tabBarStyle: { display: 'flex' } }}
            />
            <Tab.Screen
                name="Profile"
                component={PartyStack}
                options={{ tabBarStyle: { display: 'flex' } }}
            />
        </Tab.Navigator>
    );
};

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="App" component={AppNavigator} />
    
            {/* Screens not apart of the tab navigator */}
            <Stack.Screen name="Invite" component={InviteStack} />
            <Stack.Screen name="Search" component={SearchStack} />
        </Stack.Navigator>
    );
};
  
export default RootNavigator;
