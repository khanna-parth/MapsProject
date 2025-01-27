import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { storeData, postRequest } from '../utils/utils.js';

function LoginScreen() {
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

    const handleLogin = async () => {
        const { username, password } = form;
        let hasError = false;

        console.log("Sign In Clicked")

        //If fields are blank

        if (!username.trim()) {
            setPlaceholders(prev => ({ ...prev, username: 'Username Required' }));
            hasError = true;
        }

        if (!password.trim()) {
            setPlaceholders(prev => ({ ...prev, password: 'Password Required' }));
            hasError = true;
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
                                autoCapitalize='none'
                                clearButtonMode="while-editing"
                                autoCorrect={false}
                                style={styles.inputControl}
                                value={form.username}
                                onChangeText={username =>
                                    setForm(prev => ({ ...prev, username }))
                                }
                            />
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Password</Text>

                            <TextInput
                                placeholder={placeholders.password}
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                                style={styles.inputControl}
                                secureTextEntry={true}
                                value={form.password}
                                onChangeText={password =>
                                    setForm(prev => ({ ...prev, password }))
                                }
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
    inputControl: {
        height: 44,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
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
