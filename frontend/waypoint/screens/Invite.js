import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';

const defaultImage = require("../assets/default-avatar-icon.jpg")
const plusImage = require("../assets/plus.png")

import data from '../utils/defaults/defaultColors.js'
import { storeData, getData, removeData, postRequest, getPartyID } from '../utils/utils.js';

function InviteScreen({ visible, onRequestClose }) {
    const [username, setUsername] = useState("");

    const [friendList, setFriendList] = useState([]);

    const getFriends = async () => {
        const username = await getData("username");

        if (username.error) {
            return {error: true, message: "Error retrieving username."}
        }

        console.log(await postRequest('social/list', {username: username}))
    }

    const fetchPartyData = async (invitedUser, invitedUserID) => {
        console.log(`Fetching party data (added ${invitedUser} with id: ${invitedUserID}).`);
        const userID = await getData('userID');
        const partyID = await getData('partyID');

        if (userID.error || partyID.error) {
            return {error: true, message: "Error retrieving user or party ID."}
        }

        if (!partyID) {
            const newPartyID = getPartyID();

            console.log(await postRequest('party/create', {userID: userID, partyID: newPartyID}));
            await storeData('partyID', newPartyID);

            // Join party just made
            // Send invite to bruh
            //console.log(await postRequest('party/join', {userID: userID, partyID: newPartyID}));
        } else {
            // Send invite to bruh
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const data = await getFriends();

            if (!data.error) {
                //setFriendList(<whatever data>);
            }
        };
        
        //fetchData();
    }, []);

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
                <Text style={styles.listHeaderText}>Friends</Text>
                <FlatList 
                    //data={friendList}
                    data={[{ "userID": "7", "username": "Theo" }, { "userID": "8", "username": "Collin" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.userID}>
                                <Image source={defaultImage} style={styles.cardImage}/>
                                <View style={styles.cardTextArea} key={item.userID}>
                                    <Text style={styles.cardText}>{item.username}</Text>
                                    <TouchableOpacity onPress={() => fetchPartyData(item.username, item.userID)}>
                                        <Image source={plusImage} style={styles.cardPlusImage}/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.userID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                />
                {/* <Button title='Close' color={data.primaryColor} onPress={() => {
                    setSearchModalVisible(false); 
                    setUsername("");
                }} />                 */}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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