import { StyleSheet, Text, View, Button, Platform, SafeAreaView, Image } from 'react-native';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';

import { postRequest, getData } from '../utils/utils.js';
import data from '../utils/defaults/assets.js'

function WelcomeScreen() {
    const navigation = useNavigation();

    const { setCurrentUser } = useGlobalState();

    useEffect(() => {
        const attemptAutoLogin = async () => {
            const username = await getData('username');
            const password = await getData('password');

            if (!username.error && !password.error) {
                const response = await postRequest('auth/login', { username: username.data, password: password.data });


                if (!response.error) {
                    console.log('Login successful:', username.data);
                    
                    setCurrentUser(username.data);
    
                    navigation.navigate('Home');
                }
            }

        };

        attemptAutoLogin();
    }, []);

    // Login button pressed
    const handleLogIn = () => {
        console.log('Login');
        navigation.navigate('LoginScreen');
    };

    // Google button pressed
    const handleGoogle = () => {
        
    };

    // Create button pressed
    const handleCreate = () => {
        console.log('Create Account');
        navigation.navigate('CreateAccount');
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.wrapper}>

                {/* Log in button */}

                {/* <View style={styles.loginButtonContainer}>
                    <Button title="Log In" color="#F2F2F2" onPress={handleLogIn} />
                </View> */}

                {/* Text, Image, and Buttons */}

                <View style={styles.centeredContent}>
                    {/* Replace with logo */}
                    <Image source={data.images.logo} style={styles.image} />
                    {/* <Text style={styles.welcomeLabel}>Waypoint</Text> */}
                    {/* <View style={styles.googleButtonContainer}>
                        <Button title="Continue with Google" color="#3E82FC" onPress={handleGoogle} /> 
                    </View> */}
                    <View style={styles.buttonContainer}>
                        <Button title="Log In" color="#F2F2F2" onPress={handleLogIn} /> 
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button title="Sign Up" color="#F2F2F2" onPress={handleCreate} /> 
                    </View>
                </View>

                {/* Bottom Disclaimer */}
                
                <Text style={styles.endText}>By creating an account, you agree to Waypoint's <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>, <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>, and <Text style={{ textDecorationLine: 'underline' }}>Safety Policy</Text>.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: data.colors.primaryColor,
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
    },
    loginButtonContainer: {
        position: 'absolute',
        right: 20,
    },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
    },
    image: {
        width: 250,
        height: 250,
        alignSelf: 'center',
        marginBottom: 35
    },
    googleButtonContainer: {
        height: 45,
        width: '100%',
        borderRadius: 20,
        backgroundColor: data.colors.offWhite,
        justifyContent: 'center',
        alignSelf: "center",
        marginBottom: 25
    },
    buttonContainer: {
        height: 45,
        width: '100%',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: data.colors.offWhite,
        justifyContent: 'center',
        alignSelf: "center",
        marginBottom: 25,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    welcomeLabel: {
        fontSize: 48,
        marginBottom: 90,
        fontWeight: 'bold',
        color: "#F2F2F2",
        alignSelf: "center",
    },
    endText: {
        color: data.colors.offWhite,
        textAlign: 'center',
        paddingBottom: 10
    }
});

export default WelcomeScreen;
