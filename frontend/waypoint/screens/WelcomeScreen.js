import { StyleSheet, Text, View, Button, Platform, SafeAreaView, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import data from '../utils/defaults/defaultColors.js'

function WelcomeScreen() {
    const navigation = useNavigation();

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

                <View style={styles.loginButtonContainer}>
                    <Button title="Log In" color="#F2F2F2" onPress={handleLogIn} />
                </View>

                {/* Text, Image, and Buttons */}

                <View style={styles.centeredContent}>
                    {/* Replace with logo */}
                    <Image source={{ uri: "https://picsum.photos/id/237/200/300" }} style={styles.image} />
                    <Text style={styles.welcomeLabel}>Waypoint</Text>
                    <View style={styles.googleButtonContainer}>
                        <Button title="Continue with Google" color="#3E82FC" onPress={handleGoogle} /> 
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button title="Create Account" color="#F2F2F2" onPress={handleCreate} /> 
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
        backgroundColor: data.primaryColor,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 100,
        height: 100,
        alignSelf: 'flex-start',
        marginBottom: 25
    },
    googleButtonContainer: {
        height: 45,
        width: '100%',
        borderRadius: 20,
        backgroundColor: data.offWhite,
        justifyContent: 'center',
        alignSelf: "center",
        marginBottom: 25
    },
    buttonContainer: {
        height: 45,
        width: '100%',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: data.offWhite,
        justifyContent: 'center',
        alignSelf: "center",
    },
    welcomeLabel: {
        fontSize: 32,
        marginBottom: 90,
        fontWeight: 'bold',
        color: "#F2F2F2",
        alignSelf: "baseline"
    },
    endText: {
        color: data.offWhite,
        textAlign: 'center',
        paddingBottom: 10
    }
});

export default WelcomeScreen;
