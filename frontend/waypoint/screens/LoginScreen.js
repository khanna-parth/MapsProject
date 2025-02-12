import { useState,  useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { storeData, postRequest, storeKeychainData, getKeychainData } from '../utils/utils.js';


function LoginScreen() {
    const navigation = useNavigation();

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

    const [errorBorders, setErrorBorders] = useState({
        username: 0,
        password: 0,
    });

    useEffect(() => {
        const attemptAutoLogin = async () => {
            try {
                const storedCredentials = await getKeychainData();
                if (storedCredentials && storedCredentials.username && storedCredentials.password) {
                    console.log('Stored credentials found, attempting auto-login');
    
                    setForm({
                        username: storedCredentials.username,
                        password: storedCredentials.password,
                    });
    
                    handleLogin(storedCredentials.username, storedCredentials.password, true);
                } else {
                    console.log("No credentials found.");
                }
            } catch (error) {
                console.error('Error retrieving stored credentials:', error);
            }
        };

        attemptAutoLogin();
    }, []);

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
                
                await storeData('username', userData.username);
                await storeData('userID', userData.userID);
                // const storeCredentials = await storeKeychainData(username, password);
                // if (storeCredentials.error) {
                //     console.error('Ignore for now - Error storing credentials:', storeCredentials.message);
                // } else {
                //     console.log('User credentials stored successfully');
                // }

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
