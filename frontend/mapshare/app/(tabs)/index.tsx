import { StyleSheet, Text, View, Button, Platform, SafeAreaView, Image } from 'react-native';

function TabOneScreen() {
    const handleLogIn = () => {
        
    };

    const handleGoogle = () => {
        
    };

    const handleCreate = () => {
        
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.wrapper}>
            <View style={styles.loginButtonContainer}>
                <Button title="Log In" color="#F2F2F2" onPress={handleLogIn} />
            </View>
                <View style={styles.centeredContent}>
                    {/* Replace with logo */}
                    <Image source={{ uri: "https://picsum.photos/id/237/200/300" }} style={styles.image} />
                    <Text style={styles.welcomeLabel}>Welcome to Waypoint.</Text>
                    <View style={styles.googleButtonContainer}>
                        <Button title="Continue with Google" color="#3E82FC" onPress={handleGoogle} /> 
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button title="Create Account" color="#F2F2F2" onPress={handleCreate} /> 
                    </View>
                </View>
                <Text style={styles.endText}>By creating an account, you agree to Waypoint's <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>, <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>, and <Text style={{ textDecorationLine: 'underline' }}>Safety Policy</Text>.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: '#3E82FC',
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: 20,
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
        backgroundColor: '#F2F2F2',
        justifyContent: 'center',
        alignSelf: "center",
        marginBottom: 25
    },
    buttonContainer: {
        height: 45,
        width: '100%',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#F2F2F2',
        justifyContent: 'center',
        alignSelf: "center",
    },
    welcomeLabel: {
        fontSize: 32,
        marginBottom: 90,
        fontWeight: 'bold',
        color: "#F2F2F2"
    },
    endText: {
        color: "#F2F2F2",
        textAlign: 'center',
        paddingBottom: 10
    }
});

export default TabOneScreen;
