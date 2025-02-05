import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';

const defaultImage = require("../assets/default-avatar-icon.jpg")

import data from '../utils/defaults/assets.js'
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends, joinParty } from '../utils/userUtils.js';

function InviteScreen({ visible, onRequestClose, updateParty }) {
    const [username, setUsername] = useState("");

    const [friendList, setFriendList] = useState([]);

    // Get all friends of logged in user
    const getFriends = async () => {
        const usernameData = await getData("username");

        if (usernameData.error) {
            return {error: true, message: "Error retrieving username."};
        }

        const friendData = await getUserFriends(usernameData.data);

        if (!friendData.error) {
            setFriendList(friendData.data);
        }
    }

    const inviteButtonPressed = async (invitedUser) => {
        console.log(`Fetching party data (added ${invitedUser}).`);
        
        const userID = await getData('userID');
        const partyID = await getData('partyID');

        if (userID.error) {
            return {error: true, message: "Error retrieving user or party ID."}
        }
        
        // If user does not have a saved party ID, meaning they have no party
        if (partyID.error) {
            const createdPartyData = await postRequest('party/create', {userID: userID.data});

            if (!createdPartyData.error) {
                await joinParty(userID.data, createdPartyData.data);
                await storeData('partyID', createdPartyData.data);
                await updateParty();
            }
            // Invite bruh

        // If user already has a saved party ID, meaning they were in party
        } else {
            await joinParty(userID.data, partyID.data);

            await updateParty();
            // Send invite to bruh
        }
    };

    useEffect(() => {
        if (visible) {
            getFriends()
        }

    }, [visible]);
    
    return (
        <Modal visible={ visible } 
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={ onRequestClose }>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Invite Friend</Text>
                <TextInput 
                    style={styles.textInput} 
                    placeholder='Search'
                    value={username}
                    onChangeText={setUsername}
                />
                <FlatList 
                    data={friendList}
                    //data={[{ "userID": "7", "username": "Theo" }, { "userID": "8", "username": "Collin" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.cardID}>
                                <Image source={defaultImage} style={styles.cardImage}/>
                                <View style={styles.cardTextArea} key={item.cardID}>
                                    <Text style={styles.cardText}>{item.username}</Text>
                                    <TouchableOpacity onPress={() => inviteButtonPressed(item.username)}>
                                        <Image source={data.images.plusIcon} style={styles.cardPlusImage}/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.cardID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                    ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 20,}}>No Friends Founds</Text>}
                    ListHeaderComponent={<Text style={styles.listHeaderText}>Friends</Text>}
                />
                {/* <Button title='Close' color={data.colors.primaryColor} onPress={() => {
                    setSearchModalVisible(false); 
                    setUsername("");getPartyID
                }} />                 */}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: data.colors.offWhite,
        padding: 16,
        paddingBottom: 0,
    },
    modalTitle: {
        textAlign: 'center',
        paddingBottom: 16,
        fontSize: 24,
        fontWeight: 'bold'
    },
    textInput: {
        height: 40,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 5
    },
    listHeaderText: {
        fontSize: 20,
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextArea: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    cardPlusImage: {
        width: 25,
        height: 25,
        alignSelf: 'flex-end'
    },
});

export default InviteScreen;