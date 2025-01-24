import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, Image, Modal, Button, TextInput } from 'react-native';
import { useState } from 'react';

import Box from '../components/Box';
import data from './defaults/defaultColors.js'

const defaultImage = require("../assets/default-avatar-icon.jpg")

import { useNavigation } from '@react-navigation/native';

function PartyScreen() {
    const navigation = useNavigation();

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);

    const [username, setUsername] = useState("")

    // Press leave button
    const handleLeave = () => {
        console.log('leave');
    };

    // Press search button
    const handleSearch = () => {
        setSearchModalVisible(true);
        setInviteModalVisible(false);
        //console.log('search');
        //navigation.navigate('Search');
    };

    // Press invite button
    const handleInvite = () => {
        setSearchModalVisible(false);
        setInviteModalVisible(true);
        //console.log('invite');
        //navigation.navigate('Invite');
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            
            {/* Top Button Row */}

            <View style={styles.topButtons}>
                <Box style={{ backgroundColor: "#C65252"}} onPress={handleLeave}>Leave</Box>
                <Box onPress={handleSearch}>Search</Box>
                <Box onPress={handleInvite}>Invite</Box>
            </View>

            {/* List of party members */}

            <View style={styles.wrapper}>
                <Text style={styles.listHeaderText}>Party Members</Text>
                <FlatList 
                    data={[{ "id": "7", "type": "Water", "name": "Grant" }, { "id": "8", "type": "Water", "name": "Regis" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.id}>
                                <Image source={defaultImage} style={styles.cardImage}/>
                                <View style={styles.cardTextArea} key={item.id}>
                                    <Text style={styles.cardText}>{item.name}</Text>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.id.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                />
            </View>

            {/* Search Screen */}

            <Modal visible={searchModalVisible} 
                animationType='slide'
                presentationStyle='pageSheet'
                onRequestClose={ () => {
                    setSearchModalVisible(false);
                    setUsername("");
                }}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Search User</Text>
                    <TextInput 
                        style={styles.textInput} 
                        placeholder='Search'
                        value={username}
                        onChangeText={setUsername}
                    />
                        <Text style={styles.listHeaderText}>Results</Text>
                        <FlatList 
                        data={[{ "id": "7", "type": "Water", "name": "Parth Khanna" }, { "id": "8", "type": "Water", "name": "Howard" }]}
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.card} key={item.id}>
                                    <Image source={defaultImage} style={styles.cardImage}/>
                                    <View style={styles.cardTextArea} key={item.id}>
                                        <Text style={styles.cardText}>{item.name}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        horizontal={false}
                        keyExtractor={(item) => item.id.toString()}
                        ItemSeparatorComponent={<View style={{ height: 16 }} />}
                    />
                    {/* <Button title='Close' color={data.primaryColor} onPress={() => {
                        setSearchModalVisible(false); 
                        setUsername("");
                    }} />                 */}
                </View>
            </Modal>

            {/* Invite Screen */}

            <Modal visible={inviteModalVisible} 
                animationType='slide'
                presentationStyle='pageSheet'
                onRequestClose={ () => {
                    setInviteModalVisible(false);
                    setUsername("");
                }}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Invite Friend</Text>
                    <TextInput 
                        style={styles.textInput} 
                        placeholder='Search'
                        value={username}
                        onChangeText={setUsername}
                    />
                        <Text style={styles.listHeaderText}>Friends</Text>
                        <FlatList 
                        data={[{ "id": "7", "type": "Water", "name": "Theo" }, { "id": "8", "type": "Water", "name": "Collin" }]}
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.card} key={item.id}>
                                    <Image source={defaultImage} style={styles.cardImage}/>
                                    <View style={styles.cardTextArea} key={item.id}>
                                        <Text style={styles.cardText}>{item.name}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        horizontal={false}
                        keyExtractor={(item) => item.id.toString()}
                        ItemSeparatorComponent={<View style={{ height: 16 }} />}
                    />
                    {/* <Button title='Close' color={data.primaryColor} onPress={() => {
                        setSearchModalVisible(false); 
                        setUsername("");
                    }} />                 */}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: data.offWhite,
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextArea: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        //marginBottom: 16
    },
    cardImage: {
        width: 50,
        height: 50,
        backgroundColor: 'white',
        marginRight: 10,
        borderRadius: 100,
    },
    cardText: {
        fontSize: 20
    },
    listHeaderText: {
        fontSize: 20,
        marginBottom: 12,
    },
    topButtons: {
        justifyContent: "space-evenly",
        flexDirection: 'row',
        paddingBottom: 16
    },
    modalContainer: {
        flex: 1,
        backgroundColor: data.offWhite,
        padding: 16,
        paddingBottom: 0,
    },
    modalTitle: {
        textAlign: 'center',
        paddingBottom: 16,
        fontSize: 20,
        fontWeight: 'bold'
    },
    textInput: {
        height: 40,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 5
    },
});

export default PartyScreen;