import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons'
import Icon2 from 'react-native-vector-icons/AntDesign'

const defaultImage = require("../assets/default-avatar-icon.jpg")

import data from '../utils/defaults/assets.js'
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends } from '../utils/userUtils.js';
import { UserAvatar } from './UserSearch.jsx';

function InviteScreen({ visible, onRequestClose }) {
    const { joinParty } = useGlobalState();
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

    // Invited user to party
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
                await storeData('partyID', createdPartyData.data);
                await joinParty(userID.data, createdPartyData.data);
                //setPartySocket(partySocketData); 
                await postRequest('party/modify', {userID: userID.data, partyID: createdPartyData.data, modification: "invite", properties: {user: invitedUser}});
                //await updateParty();
            } else {
                removeData('partyID');
            }

        // If user already has a saved party ID, meaning they were in party, join it
        } else {
            //setPartySocket(partySocketData);
            await postRequest('party/modify', {userID: userID.data, partyID: partyID.data, modification: "invite", properties: {user: invitedUser}});
            await joinParty(userID.data, partyID.data);
            //await updateParty();
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
            onRequestClose={ onRequestClose }
        >
            <StatusBar
                barStyle="light-content"
            />
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalViewContainer}>
                    <TouchableOpacity style={{zIndex: 10}} onPress={onRequestClose}>
                        <Icon name='chevron-back' size={24} color='black' style={{ position: 'absolute', width: 50, height: 50}}/>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Invite to Party</Text>
                    <FlatList 
                        style={{ flex:1, position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, paddingHorizontal: 16 }}
                        contentContainerStyle={{ flexGrow: 1, padding: 0 }}
                        data={friendList}
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.card} key={item.cardID}>
                                    <UserAvatar username={item.username} />
                                    {/* <Image source={defaultImage} style={styles.cardImage}/> */}
                                    <View style={styles.cardTextArea} key={item.cardID}>
                                        <Text style={styles.cardText}>{item.username}</Text>
                                        <TouchableOpacity onPress={() => inviteButtonPressed(item.username)}>
                                            {/* <Image source={data.images.plusIcon} style={styles.cardPlusImage}/> */}
                                            <Icon2 name='plus' size={25} color='black' style={styles.cardPlusImage}/>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                        horizontal={false}
                        keyExtractor={(item) => item.cardID.toString()}
                        ItemSeparatorComponent={<View style={{ height: 16 }} />}
                        ListEmptyComponent={
                            <View style={styles.listEmptyContainer}>
                                <View style={{height: '75%', justifyContent: 'center'}}>
                                    <Icon2 style={{alignSelf: 'center', paddingBottom: 8}} name='deleteuser' size={100} color='#dddddd' />
                                    <Text style={styles.instructionText}>No Friends Found</Text>
                                </View>
                            </View>
                        }
                        ListHeaderComponent={
                            friendList.length != 0 && (
                                <Text style={styles.listHeaderText}>Friends</Text>
                            )
                        }
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: data.colors.offWhite,
    },
    modalViewContainer: {
        flex: 1,
        padding: 16,
        paddingBottom: 0,
    },
    modalTitle: {
        textAlign: 'center',
        paddingBottom: 14,
        fontSize: 24,
        fontWeight: 'bold'
    },
    textInput: {
        height: 40,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 20
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
        borderRadius: 20,
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
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
        alignSelf: 'flex-end'
    },
    listEmptyContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    instructionText: {
        alignSelf: 'center',
        color: '#999',
        fontSize: 18,
        textAlign: 'center',
        textAlign: 'center',
        fontSize: 20,
    },
});

export default InviteScreen;