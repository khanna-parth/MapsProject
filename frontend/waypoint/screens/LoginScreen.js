import { useState,  useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { postRequest } from '../utils/utils.js';
import { storeData, removeData, clearKeysWithPrefix } from '../utils/asyncStorage';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { getSyncedData } from '../utils/syncStorage';


function LoginScreen() {
    const navigation = useNavigation();

    const { setCurrentUser } = useGlobalState();

    //Actual Data
    const [form, setForm] = useState({
        username: '',
        password: '',
    });

    //Placeholders :)
    const [placeholders, setPlaceholders] = useState({
        username: '',
        password: '',
    });

    //Error box
    const [errorBorders, setErrorBorders] = useState({
        username: 0,
        password: 0,
    });

    const handleLogin = async () => {
        const { username, password } = form;
        let hasError = false;

        console.log("Sign In Clicked")

        if (!username.trim()) {
            setPlaceholders(prev => ({ ...prev, username: 'Username Required' }));
            setErrorBorders(prev => ({ ...prev, username: 1 }));
            hasError = true;
        } else {
            setPlaceholders(prev => ({ ...prev, username: ' ' }));
            setErrorBorders(prev => ({ ...prev, username: 0 }));
        }

        if (!password.trim()) {
            setPlaceholders(prev => ({ ...prev, password: 'Password Required' }));
            setErrorBorders(prev => ({ ...prev, password: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, password: 0 }));
            setPlaceholders(prev => ({ ...prev, password: ' ' }));
        }

        if (hasError) {
            console.log('Empty Fields');
            return;
        }

        //Login Attempt
        try {
            const response = await postRequest('auth/login', { username: username, password: password });

            if (!response.error) {
                const userData = response.data;
                console.log('Login successful:', userData);
                
                // Clear any previous user data
                await removeData('user');
                await removeData('profilePicture');
                
                // Clear any previous friend profile pictures
                await clearKeysWithPrefix('profilePicture_');
                console.log('Cleared previous friend profile pictures');
                
                // Set current user after clearing data
                setCurrentUser(userData.username);
                
                // Store individual fields as strings
                await storeData('username', userData.username);
                await storeData('userID', userData.userID);
                await storeData('password', password);
                
                // Create a token if one isn't provided by the server
                const token = userData.token || userData.userID;
                
                // Store the complete user object with token
                const userObject = {
                    ...userData,
                    token: token
                };
                
                await storeData('user', userObject);
                
                // Try to fetch profile picture from server
                try {
                    const profilePicData = await getSyncedData('profilePicture', true); // Force sync from server
                    console.log('Fetched profile picture from server:', profilePicData ? 'success' : 'not found');
                    
                    if (profilePicData && profilePicData.imageUri) {
                        // Update user object with profile picture
                        const updatedUserObject = {
                            ...userObject,
                            profilePicture: profilePicData.imageUri
                        };
                        await storeData('user', updatedUserObject);
                        console.log('Updated user object with profile picture');
                    } else {
                        console.log('No profile picture found on server');
                    }
                } catch (error) {
                    console.error('Error fetching profile picture:', error);
                }
                
                console.log('User authenticated, starting sync for profile data');
                
                navigation.navigate('Home');
            } else {
                console.error('Login failed:', response.message);
                alert('Invalid username or password. Please try again.');
            }
        } catch (error) {
            console.error('Error during login process:', error);
            alert('An error occurred. Please try again later.');
        }
    }

    const handleForgot = () => {
        //Need to speak with parf
        console.log("Forgot Password - Not Implemented Yet")
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#e8ecf4'}}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image
                    //Swap Image With Our Logo
                     source={{uri: 'https://withfra.me/android-chrome-512x512.png'}}
                     style={styles.headerImg}
                     alt='Logo'
                    />

                    <Text style={styles.title}>Sign in to Waypoint</Text>

                    <Text style={styles.subtitle}>
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Username</Text>

                            <TextInput
                                placeholder={placeholders.username}
                                placeholderTextColor='#FF0000'
                                autoCapitalize='none'
                                clearButtonMode="while-editing"
                                autoCorrect={false}
                                style={[
                                    styles.inputControlUser,
                                    { borderWidth: errorBorders.username }
                                ]}
                                value={form.username}
                                onChangeText={username => {
                                    setForm(prev => ({ ...prev, username}));
                                    setErrorBorders(prev => ({
                                        ...prev, username: 0,
                                    }));
                                    setPlaceholders(prev => ({ ...prev, username: ' '}));
                                }}
                            />
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Password</Text>

                            <TextInput
                                placeholder={placeholders.password}
                                placeholderTextColor='#FF0000'
                                autoCorrect={false}
                                //clearButtonMode="while-editing"
                                style={[
                                    styles.inputControlPass,
                                    { borderWidth: errorBorders.password }
                                ]}
                                secureTextEntry={true}
                                value={form.password}
                                onChangeText={password => {
                                    setForm(prev => ({ ...prev, password }));
                                    setErrorBorders(prev => ({
                                        ...prev, password: 0,
                                    }));
                                    setPlaceholders(prev => ({ ...prev, password: ' '}));
                                }}
                            />
                        </View>
                    </View>

                    <View style={styles.formAction}>
                        <TouchableOpacity  onPress={handleLogin}>
                            <View style={styles.btn}>
                                <Text style={styles.btnText}>Sign in</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleForgot}>
                        <Text style={styles.formLink}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
                
            </View>
            
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flex: 1
    },
    header: {
        marginVertical: 36,
    },
    headerImg: {
        width: 80,
        height: 88,
        alignSelf: 'center',
        marginBottom: 36,
    },
    title: {
        fontSize: 27,
        fontWeight: '700',
        color: '#1e1e1e',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize:15,
        fontWeight: '500',
        color: '#929292',
        textAlign: 'center'
    },
    formLink: {
        paddingTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#075eec',
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#222',
        marginBottom: 8,
    },
    inputControlUser: {
        height: 44,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
        borderColor: '#FF0000',
        borderWidth: 0,
    },
    inputControlPass: {
        height: 44,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
        borderColor: '#FF0000',
        borderWidth: 0,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        backgroundColor: '#075eec',
        borderColor: '#075eec',
    },
    btnText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '600',
        color: '#fff',
    },
});

export default LoginScreen;
