import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

import { storeData, postRequest } from '../utils/utils.js';

import { useNavigation } from '@react-navigation/native';

function CreateAccountScreen() {
    const navigation = useNavigation();

    // Actual Data
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        reenterPassword: '',
    });

    // Placeholders :)
    const [placeholders, setPlaceholders] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        reenterPassword: '',
    });

    const handleCreateAccount = async () => {
        const { firstName, lastName, username, password, reenterPassword } = form;
        let hasError = false;

        console.log("Create Account Clicked");
        console.log(firstName);

        if (!firstName.trim()) {
            setPlaceholders(prev => ({ ...prev, firstName: 'First Name Required' }));
            hasError = true;
        }

        if (!lastName.trim()) {
            setPlaceholders(prev => ({ ...prev, lastName: 'Last Name Required' }));
            hasError = true;
        }

        if (!username.trim()) {
            setPlaceholders(prev => ({ ...prev, username: 'Username Required' }));
            hasError = true;
        }

        if (!password.trim()) {
            setPlaceholders(prev => ({ ...prev, password: 'Password Required' }));
            hasError = true;
        }

        if (password !== reenterPassword) {
            setPlaceholders(prev => ({ ...prev, reenterPassword: 'Passwords do not match' }));
            setForm(prev => ({ ...prev, reenterPassword: '' })); // Clear the input
            reenterPasswordInputRef.current.blur(); // Unfocus the input
            hasError = true;
        }

        if (hasError) {
            console.log('Invalid Fields');
            return;
        }

        // Create Account
        try {
            const response = await postRequest('auth/create', { username: username, password: password });
        
            if (!response.error) {
                console.log('Account created successfully:', response.data);

                try {
                    const response = await postRequest('auth/login', { username: username, password: password });
        
                    if (!response.error) {
                        const userData = response.data;
                        navigation.navigate('Home');

                        console.log('Login successful:', userData);
                
                    } else {
                        console.error('Login failed:', response.message);
                        alert('Invalid username or password. Please try again.');
                    }

                } catch (error) {
                    console.error('Error during login process:', error);
                    alert('An error occurred. Please try again later.');
                }
            } else {
                console.error('Account creation failed:', response.message);
                alert('Error creating account. Please try again.');
            }
        } catch (error) {
            console.error('Error during account creation:', error);
            alert('An error occurred. Please try again later.');
        }
        
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#e8ecf4' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.container}>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={styles.header}>
                            <Image
                                // Swap Image With Our Logo
                                source={{ uri: 'https://withfra.me/android-chrome-512x512.png' }}
                                style={styles.headerImg}
                                alt='Logo'
                            />

                            <Text style={styles.title}>Create Account</Text>

                            <Text style={styles.subtitle}>
                            </Text>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>First Name</Text>

                                    <TextInput
                                        placeholder={placeholders.firstName}
                                        autoCapitalize='words'
                                        clearButtonMode="while-editing"
                                        autoCorrect={false}
                                        style={styles.inputControl}
                                        value={form.firstName}
                                        onChangeText={firstName =>
                                            setForm(prev => ({ ...prev, firstName }))
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Last Name</Text>

                                    <TextInput
                                        placeholder={placeholders.lastName}
                                        autoCapitalize='words'
                                        clearButtonMode="while-editing"
                                        autoCorrect={false}
                                        style={styles.inputControl}
                                        value={form.lastName}
                                        onChangeText={lastName =>
                                            setForm(prev => ({ ...prev, lastName }))
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Username</Text>

                                    <TextInput
                                        placeholder={placeholders.username}
                                        clearButtonMode="while-editing"
                                        style={styles.inputControl}
                                        value={form.username}
                                        onChangeText={username =>
                                            setForm(prev => ({ ...prev, username }))
                                        }
                                        onFocus={() =>
                                            setPlaceholders(prev => ({ ...prev, username: 'Used to Sign-In' }))
                                        }
                                        onBlur={() =>
                                            setPlaceholders(prev => ({ ...prev, username: '' })) //Makes it go away on un-focus
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Password</Text>

                                    <TextInput
                                        placeholder={placeholders.password}
                                        secureTextEntry={true}
                                        autoCorrect={false}
                                        clearButtonMode="while-editing"
                                        style={styles.inputControl}
                                        value={form.password}
                                        onChangeText={password =>
                                            setForm(prev => ({ ...prev, password }))
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Re-enter Password</Text>

                                    <TextInput
                                        placeholder={placeholders.reenterPassword}
                                        secureTextEntry={true}
                                        autoCorrect={false}
                                        clearButtonMode="while-editing"
                                        style={styles.inputControl}
                                        value={form.reenterPassword}
                                        onChangeText={reenterPassword =>
                                            setForm(prev => ({ ...prev, reenterPassword }))
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.formAction}>
                                <TouchableOpacity onPress={handleCreateAccount}>
                                    <View style={styles.btn}>
                                        <Text style={styles.btnText}>Create Account</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flexGrow: 1,
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
        fontSize: 15,
        fontWeight: '500',
        color: '#929292',
        textAlign: 'center',
    },
    form: {
        marginBottom: 16,
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

export default CreateAccountScreen;
