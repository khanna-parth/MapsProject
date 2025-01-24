import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View , Image} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';


function LoginScreen() {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

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

                    <Text style={styles.title}>Log in to Waypoint</Text>

                    <Text style={styles.subtitle}>
                        Joe Mama
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Email</Text>

                            <TextInput
                                autoCapitalize='none'
                                autoCorrect={false}
                                keyboardType='email-address'
                                style={styles.inputControl}
                                value={form.email}
                                onChangeText={email => setForm({ ...form, email })}
                            />
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Password</Text>

                            <TextInput
                                secureTextEntry
                                style={styles.inputControl}
                                value={form.password}
                                onChangeText={password => setForm({ ...form, password })}
                            />
                        </View>
                    </View>
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
    input: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#222' 
    },
    inputControl: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontWeight: '500',
        color: '#222',
    },
});

export default LoginScreen;
