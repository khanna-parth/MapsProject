import { useState,  useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'

import data from '../utils/defaults/assets.js'

import { storeData, postRequest, storeKeychainData, getKeychainData, getData } from '../utils/utils.js';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';


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
                
                setCurrentUser(userData.username);
                await storeData('username', userData.username);
                await storeData('userID', userData.userID);
                
                // Temporary
                await storeData('password', password);
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
        <SafeAreaView style={{flex: 1, backgroundColor: data.colors.offWhite}}>
            <TouchableOpacity style={{zIndex: 10}} onPress={() => {navigation.goBack();}}>
                <Icon name='chevron-back' size={24} color='black' style={{ position: 'absolute', left: 15, width: 50, height: 50}}/>
            </TouchableOpacity>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image
                    //Swap Image With Our Logo
                        source={data.images.logo}
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
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 36,
        borderRadius: 20,
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
        color: data.colors.primaryColor,
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
        backgroundColor: 'white',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
        borderColor: '#FF0000',
        borderWidth: 0,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    inputControlPass: {
        height: 44,
        backgroundColor: 'white',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
        borderColor: '#FF0000',
        borderWidth: 0,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        backgroundColor: data.colors.primaryColor,
        borderColor: data.colors.primaryColor,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    btnText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '600',
        color: data.colors.offWhite,
    },
});

export default LoginScreen;
