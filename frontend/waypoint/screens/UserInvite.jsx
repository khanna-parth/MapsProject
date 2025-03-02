import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons'
import Icon2 from 'react-native-vector-icons/AntDesign'

const defaultImage = require("../assets/default-avatar-icon.jpg")

import data from '../utils/defaults/assets.js'
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends, getUserProfilePicture } from '../utils/userUtils.js';
import { getSyncedData, storeSyncedData } from '../utils/syncStorage';

function InviteScreen({ visible, onRequestClose }) {
    const { joinParty } = useGlobalState();
    const [friendList, setFriendList] = useState([]);
    const [friendProfilePics, setFriendProfilePics] = useState({});

    // Load profile pictures for friends
    const loadFriendProfilePictures = async (friends) => {
        if (!friends || !Array.isArray(friends) || friends.length === 0) return friends;
        
        console.log(`Loading profile pictures for ${friends.length} friends`);
        const profilePics = { ...friendProfilePics };
        
        for (const friend of friends) {
            try {
                console.log(`Attempting to load profile picture for ${friend.username}`);
                
                // Try to get profile picture from synced storage first
                const profilePicData = await getSyncedData(`profilePicture_${friend.username}`);
                
                if (profilePicData && profilePicData.imageUri) {
                    console.log(`Found cached profile picture for ${friend.username}`);
                    profilePics[friend.username] = profilePicData.imageUri;
                    friend.profilePicture = profilePicData.imageUri;
                } else {
                    console.log(`No cached profile picture for ${friend.username}, fetching from server`);
                    // If not in synced storage, try to fetch from server
                    const serverPicData = await getUserProfilePicture(friend.username);
                    
                    if (!serverPicData.error && serverPicData.data) {
                        // The getUserProfilePicture function returns data.imageUri
                        const imageUri = serverPicData.data.imageUri;
                        if (imageUri) {
                            console.log(`Got profile picture for ${friend.username} from server`);
                            profilePics[friend.username] = imageUri;
                            friend.profilePicture = imageUri;
                            
                            // Save to synced storage for future use
                            await storeSyncedData(`profilePicture_${friend.username}`, { 
                                imageUri: imageUri,
                                timestamp: Date.now()
                            });
                            
                            // Also save to AsyncStorage for compatibility
                            await storeData(`profilePicture_${friend.username}`, imageUri);
                        }
                    } else {
                        console.log(`No profile picture available for ${friend.username}`);
                    }
                }
            } catch (error) {
                console.error(`Error loading profile picture for ${friend.username}:`, error);
            }
        }
        
        setFriendProfilePics(profilePics);
        return friends;
    };

    // Helper function to extract first name from username
    const extractFirstName = (username) => {
        // Check if username contains a space (indicating first and last name)
        if (username && username.includes(' ')) {
            return username.split(' ')[0];
        }
        
        // Check if username contains a period, underscore or dash
        if (username && (username.includes('.') || username.includes('_') || username.includes('-'))) {
            // Split by any of these separators and take the first part
            return username.split(/[._-]/)[0];
        }
        
        // If no separator found, just return the username
        return username;
    };

    // Get all friends of logged in user
    const getFriends = async () => {
        const usernameData = await getData("username");

        if (usernameData.error) {
            return {error: true, message: "Error retrieving username."};
        }

        const friendData = await getUserFriends(usernameData.data);

        if (!friendData.error) {
            // Create initial friend objects with any cached profile pictures
            const initialFriends = friendData.data.map(friend => {
                // Extract first name if not already provided
                const firstName = friend.firstName || extractFirstName(friend.username);
                
                return {
                    ...friend,
                    firstName: firstName,
                    profilePicture: friendProfilePics[friend.username] || null
                };
            });
            
            // Set friends list immediately with any cached profile pics
            setFriendList(initialFriends);
            
            // Load profile pictures in the background
            const friendsWithPics = await loadFriendProfilePictures(initialFriends);
            if (friendsWithPics) {
                setFriendList([...friendsWithPics]);
            }
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
                                    {item.profilePicture ? (
                                        <Image 
                                            source={{ uri: item.profilePicture }} 
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Image 
                                            source={defaultImage} 
                                            style={styles.cardImage}
                                        />
                                    )}
                                    <View style={styles.cardTextArea} key={item.cardID}>
                                        <Text style={styles.cardText}>{item.firstName || item.username}</Text>
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
        fontSize: 22,
        fontWeight: 'bold'
    },
    textInput: {
        height: 42,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 18
    },
    listHeaderText: {
        fontSize: 19,
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
        padding: 14,
        borderRadius: 18,
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
        //marginBottom: 16
    },
    cardImage: {
        width: 45,
        height: 45,
        backgroundColor: 'white',
        marginRight: 10,
        borderRadius: 100,
    },
    cardText: {
        fontSize: 18
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
        fontSize: 17,
        textAlign: 'center',
    },
});

export default InviteScreen;