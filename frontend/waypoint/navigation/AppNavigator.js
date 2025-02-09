import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators  } from '@react-navigation/stack';
import { useNavigationState } from '@react-navigation/native';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import CreateAccountScreen from '../screens/CreateAccount';

import PartyScreen from '../screens/PartyScreen';
import HomeScreen from '../screens/HomeScreen';
import NavScreen from '../screens/Navigation';
import MapSearchScreen from '../screens/MapSearchScreen'
import { useState, useEffect } from 'react';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const forFade = ({ current }) => ({
    cardStyle: {
        opacity: current.progress,
    },
});

const WelcomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
        </Stack.Navigator>
    );
};

const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="HomeScreen" 
                component={HomeScreen}
            />
        </Stack.Navigator>
    );
};

const NavigationStack = ({ route }) => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="NavigationScreen" 
                component={NavScreen}
                initialParams={route?.params}
            />
        </Stack.Navigator>
    )
}

const PartyStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="ProfileScreen" 
                component={PartyScreen}
            />
        </Stack.Navigator>
    );
};

const MapSearchStack = ({ route }) => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="MapSearchScreen" 
                component={MapSearchScreen}
                initialParams={route?.params}
            />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false, }}
        >
            <Tab.Screen
                name="Welcome"
                component={WelcomeStack}
                options={{ tabBarStyle: { display: 'flex' } }}
            />
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ tabBarStyle: { display: 'flex' } }}
            />
            <Tab.Screen
                name="Navigation"
                component={NavigationStack}
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
            <Stack.Screen name="MapSearch" component={MapSearchStack} options={{ cardStyleInterpolator: forFade }}/>
        </Stack.Navigator>
    );
};
  
export default RootNavigator;
