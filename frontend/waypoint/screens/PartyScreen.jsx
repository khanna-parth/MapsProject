import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, Image, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import Box from '../components/Box';
import UserSearchScreen from './UserSearch';
import UserInviteScreen from './UserInvite';

import data from '../utils/defaults/assets.js'
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends, getUserProfilePicture } from '../utils/userUtils.js';
import { getSyncedData, storeSyncedData } from '../utils/syncStorage';

function PartyScreen({viewIndex}) {
    const { partySocket, setPartySocket, userPartyChange, setUserPartyChange, joinParty, disconnectedUser, setDisconnectedUser, setPartyMemberLocation, currentUser } = useGlobalState();

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);

    const [partySearch, setPartySearch] = useState("");

    const [partyList, setPartyList] = useState([]);
    const [partyID, setPartyID] = useState();
    const [memberProfilePics, setMemberProfilePics] = useState({});
    
    // Load profile pictures for party members
    const loadMemberProfilePictures = async (members) => {
        if (!members || !Array.isArray(members) || members.length === 0) return members;
        
        console.log(`Loading profile pictures for ${members.length} party members`);
        const profilePics = { ...memberProfilePics };
        
        for (const member of members) {
            try {
                console.log(`Attempting to load profile picture for ${member.username}`);
                
                // Try to get profile picture from synced storage first
                const profilePicData = await getSyncedData(`profilePicture_${member.username}`);
                
                if (profilePicData && profilePicData.imageUri) {
                    console.log(`Found cached profile picture for ${member.username}`);
                    profilePics[member.username] = profilePicData.imageUri;
                    member.profilePicture = profilePicData.imageUri;
                } else {
                    console.log(`No cached profile picture for ${member.username}, fetching from server`);
                    // If not in synced storage, try to fetch from server
                    const serverPicData = await getUserProfilePicture(member.username);
                    
                    if (!serverPicData.error && serverPicData.data) {
                        // The getUserProfilePicture function returns data.imageUri
                        const imageUri = serverPicData.data.imageUri;
                        if (imageUri) {
                            console.log(`Got profile picture for ${member.username} from server`);
                            profilePics[member.username] = imageUri;
                            member.profilePicture = imageUri;
                            
                            // Save to synced storage for future use
                            await storeSyncedData(`profilePicture_${member.username}`, { 
                                imageUri: imageUri,
                                timestamp: Date.now()
                            });
                            
                            // Also save to AsyncStorage for compatibility
                            await storeData(`profilePicture_${member.username}`, imageUri);
                        }
                    } else {
                        console.log(`No profile picture available for ${member.username}`);
                    }
                }
            } catch (error) {
                console.error(`Error loading profile picture for ${member.username}:`, error);
            }
        }
        
        setMemberProfilePics(profilePics);
        return members;
    };
    
    // Get the party details of the user and update the list
    const getPartyList = async () => {
        const userID = await getData("userID");
        const partyID = await getData("partyID");

        if (userID.error || partyID.error) {
            return {error: true, message: "Error retrieving user or party ID."}
        } else if (!partyID.data) {
            return {error: true, message: "User not in party."}
        }

        const partyData = await postRequest('party/status', {userID: userID.data, partyID: partyID.data});

        if (partyData.error) {
            setPartySocket();
            return {error: true, message: "User does not have permission to join party."}
        } else {
            // Create initial member objects
            let partyMembers = partyData.data.connected.map(member => ({
                username: member.username,
                userID: member.userID || member.username,
                profilePicture: memberProfilePics[member.username] || null
            }));

            // Set party members immediately with any cached profile pics
            setPartyID(partyID.data);
            setPartyList(partyMembers);
            
            // Load profile pictures in the background
            const membersWithPics = await loadMemberProfilePictures(partyMembers);
            if (membersWithPics) {
                setPartyList([...membersWithPics]);
            }
            
            return {error: false, message: "Party members successfully retrieved"};
        }
    }

    // Press leave button
    const handleLeave = async () => {
        const partyID = await getData('partyID');
        const userID = await getData('userID');

        await removeData('partyID');
        await setPartyList([]);

        if (!partyID.error && !userID.error) {
            await partySocket.disconnect();
            setPartySocket();
            console.log('Party left.');
        }
    };

    // Press search button
    const handleSearch = () => {
        setSearchModalVisible(true);
        setInviteModalVisible(false);
        //console.log('search');
    };

    // Press invite button
    const handleInvite = () => {
        setSearchModalVisible(false);
        setInviteModalVisible(true);
        //console.log('invite');
    };

    const handleJoinParty = async (partyID) => {
        await removeData('partyID');

        await storeData('partyID', partyID);
        const userID = await getData("userID");

        await joinParty(userID.data, partyID);
        
        const joinPartyData = await getPartyList();

        if (joinPartyData.error) {
            removeData('partyID');
        }

        setPartySearch("");
    };

    // Update user party when someone joins
    useEffect(() => {
        // Update party list when connection changed
        if (userPartyChange) {
            console.log('Party list updated');
            setUserPartyChange(false);
            getPartyList();
        }

        // Remove disconnected user from map
        if (disconnectedUser) {
            setPartyMemberLocation((prevLocations) =>
                prevLocations.filter((member) => member.username !== disconnectedUser)
            );

            setDisconnectedUser("");
        }

    }, [userPartyChange]);

    // Log into party if in one on boot
    useEffect(() => {
        const autoJoin = async () => {
            const userID = await getData("userID");
            const partyID = await getData("partyID");

            if (userID.error || partyID.error) {
                removeData('partyID');
                return;
            } else if (!partyID.data) {
                removeData('partyID');
                return;
            }

            const partyListData = await getPartyList();

            console.log(partyListData)

            if (partyListData.error) {
                await joinParty(userID.data, partyID.data);
                const partyListData2 = await getPartyList();

                if (partyListData2.error) {
                    removeData('partyID');
                }
            }
        }
        
        autoJoin();
    }, []);

    return (
        <TouchableWithoutFeedback style={styles.notSearch} onPressIn={() => Keyboard.dismiss()}>
            <SafeAreaView style={styles.safeContainer}>
                
                {/* Top Button Row */}

                <View style={styles.topButtons}>
                    <Box source={data.images.searchIcon} onPress={handleSearch}>Search</Box>
                    <Box source={data.images.inviteButtonIcon} onPress={handleInvite}>Invite</Box>
                </View>

                {/* List of party members */}

                <View style={styles.wrapper}>
                    <FlatList
                        style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 5 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        data={partyList}
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.card} key={item.userID}>
                                    <View style={styles.cardImage}>
                                        {item.profilePicture ? (
                                            <Image 
                                                source={{ uri: item.profilePicture }} 
                                                style={styles.cardImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image 
                                                source={data.images.defaultAvatar} 
                                                style={styles.cardImage}
                                            />
                                        )}
                                    </View>
                                    
                                    <View style={styles.cardTextArea} key={item.userID}>
                                        <Text style={styles.cardText}>{item.username}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        horizontal={false}
                        keyExtractor={(item) => item.userID.toString()}
                        ItemSeparatorComponent={<View style={{ height: 16 }} />}
                        ListEmptyComponent={
                            <View style={styles.listEmptyContainer}>
                                <View style={styles.joinPartyContainer}>
                                    <TextInput 
                                        style={styles.textInput}
                                        keyboardType="numeric" 
                                        placeholder='Party ID'
                                        value={partySearch}
                                        onChangeText={setPartySearch}
                                    />
                                    <Box style={{width: 150, height: 50, justifyContent: 'center'}} textStyle={{fontSize: 16, paddingBottom: 0}} onPress={() => handleJoinParty(partySearch)}>Join Party</Box>
                                </View>
                                {/* {viewIndex == 2 ? (
                                    <View style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 16}}>
                                        <View style={{height: '30%', justifyContent: 'center'}}>
                                            <Icon style={{alignSelf: 'center', paddingBottom: 0}} name='account-group' size={125} color='#dddddd' />
                                            <Text style={styles.instructionText}>  
                                                <Text style={{color: data.colors.primaryColor}}>Join</Text> a party to get started.
                                            </Text>
                                        </View>
                                    </View>
                                ) : ( */}
                                    <View style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 16}}>
                                        <View style={{height: '75%', justifyContent: 'center'}}>
                                            <Icon style={{alignSelf: 'center', paddingBottom: 0}} name='account-group' size={125} color='#dddddd' />
                                            <Text style={styles.instructionText}>  
                                                <Text style={{color: data.colors.primaryColor}}>Join</Text> a party to get started.
                                            </Text>
                                        </View>
                                    </View>
                                {/* )} */}
                                
                                
                            </View>
                        }
                        ListHeaderComponent={
                            partyList.length > 0 ? ( // Only show header when there's data
                                <View style={{flex:1}}>
                                    <View style={styles.listHeaderContainer}>
                                        <Text style={styles.listHeaderText}>Your Party</Text>
                                        <Box 
                                            style={{ backgroundColor: data.colors.red, width: 70, height: 30, justifyContent: 'center'}} 
                                            textStyle={{ fontSize: 16, paddingBottom: 0 }} 
                                            onPress={handleLeave}
                                        >
                                            Leave
                                        </Box>
                                    </View>  
                                    <Text style={styles.partyIDText}>PartyID: {partyID}</Text>
                                </View> 
                            ) : null  
                        }
                    />
                </View>

                {/* Search Screen */}

                <UserSearchScreen 
                    visible={searchModalVisible} 
                    onRequestClose={() => {
                        setSearchModalVisible(false);
                    }} 
                ></UserSearchScreen>
                

                {/* Invite Screen */}

                <UserInviteScreen 
                    visible={inviteModalVisible} 
                    onRequestClose={() => {
                        setInviteModalVisible(false);
                    }}
                ></UserInviteScreen>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: data.colors.offWhite,
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
        padding: 14,
        borderRadius: 18,
        shadowColor: 'black',
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
    listHeaderText: {
        fontSize: 19,
        // marginBottom: 12,
    },
    partyIDText: {
        fontSize: 15,
        marginBottom: 12,
        color: '#999',
    },
    topButtons: {
        justifyContent: "space-evenly",
        flexDirection: 'row',
        paddingBottom: 16,
        paddingTop: 5
    },
    listHeaderContainer: {
        flex: 1,
        justifyContent: "space-between",
        flexDirection: 'row',
    },
    listEmptyContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    joinPartyContainer: {
        // flex: 1,
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        rowGap: 20,
    },
    textInput: {
        width: 150,
        height: 48,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 18,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    instructionText: {
        alignSelf: 'center',
        color: '#999',
        fontSize: 17,
        textAlign: 'center',
    },
});

export default PartyScreen;