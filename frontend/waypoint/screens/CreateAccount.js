import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

import { storeData, postRequest } from '../utils/utils.js';

import { useNavigation } from '@react-navigation/native';
import { useGlobalState } from '../components/GlobalStateContext';

function CreateAccountScreen() {
    const navigation = useNavigation();

    const { setCurrentUser } = useGlobalState();

    // Actual Data
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        reenterPassword: '',
    });

    // Placeholders :)
    const [placeholders, setPlaceholders] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        reenterPassword: '',
    });

    // Error Box
    const [errorBorders, setErrorBorders] = useState({
        firstName: 0,
        lastName: 0,
        email: 0,
        username: 0,
        password: 0,
        reenterPassword: 0,
    });
    
    const handleCreateAccount = async () => {
        const { firstName, lastName, email, username, password, reenterPassword } = form;
        let hasError = false;
    
        console.log("Create Account Clicked");
    
        if (!firstName.trim()) {
            setPlaceholders(prev => ({ ...prev, firstName: 'First Name Required' }));
            setErrorBorders(prev => ({ ...prev, firstName: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, firstName: 0 }));
            setPlaceholders(prev => ({ ...prev, firstName: '' }));
        }
    
        if (!lastName.trim()) {
            setPlaceholders(prev => ({ ...prev, lastName: 'Last Name Required' }));
            setErrorBorders(prev => ({ ...prev, lastName: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, lastName: 0 }));
            setPlaceholders(prev => ({ ...prev, lastName: '' }));
        }
    
        if (!email.trim()) {
            setPlaceholders(prev => ({ ...prev, email: 'Email Required' }));
            setErrorBorders(prev => ({ ...prev, email: 1 }));
            hasError = true;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setPlaceholders(prev => ({ ...prev, email: 'Invalid Email' }));
            setErrorBorders(prev => ({ ...prev, email: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, email: 0 }));
            setPlaceholders(prev => ({ ...prev, email: '' }));
        }
    
        if (!username.trim()) {
            setPlaceholders(prev => ({ ...prev, username: 'Username Required' }));
            setErrorBorders(prev => ({ ...prev, username: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, username: 0 }));
            setPlaceholders(prev => ({ ...prev, username: '' }));
        }
    
        if (!password.trim()) {
            setPlaceholders(prev => ({ ...prev, password: 'Password Required' }));
            setErrorBorders(prev => ({ ...prev, password: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, password: 0 }));
            setPlaceholders(prev => ({ ...prev, password: '' }));
        }
    
        if (!reenterPassword.trim()) {
            setPlaceholders(prev => ({ ...prev, reenterPassword: 'Re-enter Password' }));
            setErrorBorders(prev => ({ ...prev, reenterPassword: 1 }));
            hasError = true;
        } else if (password !== reenterPassword) {
            setPlaceholders(prev => ({ ...prev, reenterPassword: 'Passwords do not match' }));
            setErrorBorders(prev => ({ ...prev, reenterPassword: 1 }));
            hasError = true;
        } else {
            setErrorBorders(prev => ({ ...prev, reenterPassword: 0 }));
            setPlaceholders(prev => ({ ...prev, reenterPassword: '' }));
        }
    
        if (hasError) {
            console.log('Invalid Fields');
            return;
        }

        // Create Account
        try {
            const response = await postRequest('auth/create', 
                { username: username, password: password, email: email, firstName: firstName, lastName: lastName});
        
            if (!response.error) {
                console.log('Account created successfully:', response.data);

                try {
                    const response = await postRequest('auth/login', { username: username, password: password });
        
                    if (!response.error) {
                        const userData = response.data;

                        // await storeData('username', userData.username);
                        // await storeData('userID', userData.userID);

                        setCurrentUser(userData.username);
                        await storeData('username', userData.username);
                        await storeData('userID', userData.userID);
                        
                        // Temporary
                        await storeData('password', password);

                        console.log('Login successful:', userData);
                        navigation.navigate('Home');
                        
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
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
                                        placeholderTextColor="#FF0000"
                                        autoCapitalize='words'
                                        clearButtonMode="while-editing"
                                        autoCorrect={false}
                                        style={[styles.inputControl, { borderWidth: errorBorders.firstName }]}
                                        value={form.firstName}
                                        onChangeText={firstName => {
                                            setForm(prev => ({ ...prev, firstName }));
                                            setErrorBorders(prev => ({ ...prev, firstName: 0 }));
                                            setPlaceholders(prev => ({ ...prev, firstName: '' }));
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Last Name</Text>

                                    <TextInput
                                        placeholder={placeholders.lastName}
                                        placeholderTextColor="#FF0000"
                                        autoCapitalize='words'
                                        clearButtonMode="while-editing"
                                        autoCorrect={false}
                                        style={[styles.inputControl, { borderWidth: errorBorders.lastName }]}
                                        value={form.lastName}
                                        onChangeText={lastName => {
                                            setForm(prev => ({ ...prev, lastName }));
                                            setErrorBorders(prev => ({ ...prev, lastName: 0 }));
                                            setPlaceholders(prev => ({ ...prev, lastName: '' }));
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        placeholder={placeholders.email}
                                        placeholderTextColor="#FF0000"
                                        keyboardType='email-address'
                                        clearButtonMode="while-editing"
                                        autoCorrect={false}
                                        style={[styles.inputControl, { borderWidth: errorBorders.email }]}
                                        value={form.email}
                                        onChangeText={email => {
                                            setForm(prev => ({ ...prev, email }));
                                            setErrorBorders(prev => ({ ...prev, email: 0 }));
                                            setPlaceholders(prev => ({ ...prev, email: '' }));
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Username</Text>

                                    <TextInput
                                        placeholder={placeholders.username}
                                        placeholderTextColor="#FF0000"
                                        clearButtonMode="while-editing"
                                        style={[styles.inputControl, { borderWidth: errorBorders.username }]}
                                        value={form.username}
                                        onChangeText={username => {
                                            setForm(prev => ({ ...prev, username }));
                                            setErrorBorders(prev => ({ ...prev, username: 0 }));
                                            setPlaceholders(prev => ({ ...prev, username: '' }));
                                        }}
                                        onFocus={() =>
                                            setPlaceholders(prev => ({ ...prev, username: 'Used to Sign-In' }))
                                        }
                                        onBlur={() =>
                                            setPlaceholders(prev => ({ ...prev, username: '' })) // Makes it go away on un-focus
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Password</Text>

                                    <TextInput
                                        placeholder={placeholders.password}
                                        placeholderTextColor="#FF0000"
                                        secureTextEntry={true}
                                        autoCorrect={false}
                                        clearButtonMode="while-editing"
                                        style={[styles.inputControl, { borderWidth: errorBorders.password }]}
                                        value={form.password}
                                        onChangeText={password => {
                                            setForm(prev => ({ ...prev, password }));
                                            setErrorBorders(prev => ({ ...prev, password: 0 }));
                                            setPlaceholders(prev => ({ ...prev, password: '' }));
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.input}>
                                    <Text style={styles.inputLabel}>Re-enter Password</Text>

                                    <TextInput
                                        placeholder={placeholders.reenterPassword}
                                        placeholderTextColor="#FF0000"
                                        secureTextEntry={true}
                                        autoCorrect={false}
                                        clearButtonMode="while-editing"
                                        style={[styles.inputControl, { borderWidth: errorBorders.password }]}
                                        value={form.reenterPassword}
                                        onChangeText={reenterPassword => {
                                            setForm(prev => ({ ...prev, reenterPassword }));
                                            setErrorBorders(prev => ({ ...prev, reenterPassword: 0 }));
                                            setPlaceholders(prev => ({ ...prev, reenterPassword: '' }));
                                        }}
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

export default CreateAccountScreen;
