import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, Image, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';

import Box from '../components/Box';
import UserSearchScreen from './UserSearch';
import UserInviteScreen from './UserInvite';

import data from '../utils/defaults/assets.js'
import { storeData, getData, removeData, postRequest, getRequest, cleanupData } from '../utils/utils.js';
import { joinParty } from '../utils/userUtils';

function PartyScreen() {
    // Function to always log in admin user by default, will be removed when log in fully complete
    const test = async () => {
        //await removeData('partyID');

        const loginData = await postRequest('auth/login', {username: "test", password: "test"});

        if (!loginData.error) {
            await storeData("username", loginData.data.username);
            await storeData("userID", loginData.data.userID);

            console.log('done logging in');
        }
    }
    useEffect(() => {
        test();

    }, []);

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);

    const [partySearch, setPartySearch] = useState("");

    const [partyList, setPartyList] = useState([]);
    const [partyID, setPartyID] = useState();
    const [partySocket, setPartySocket] = useState();
    
    // Get the party details of the user and update the list
    const getPartyList = async () => {
        const userID = await getData("userID");
        const partyID = await getData("partyID");

        if (userID.error || partyID.error) {
            return {error: true, message: "Error retrieving user or party ID."}
        } else if (!partyID.data) {
            return {error: true, message: "User not in party."}
        }

        if (!partySocket) {
            const partySocketData = await joinParty(userID.data, partyID.data);
            setPartySocket(partySocketData);
        }

        const partyData = await postRequest('party/status', {userID: userID.data, partyID: partyID.data});

        console.log(partyData)

        if (partyData.error) {
            removeData('partyID');
            setPartySocket();
            return {error: true, message: "User does not have permission to join party."}
        } else {
            let partyMembers = []

            for (let i = 0; i < partyData.data.connected.length; i++) {
                partyMembers.push({username: partyData.data.connected[i].username, userID: i});
            }

            setPartyID(partyID.data)
            setPartyList(partyMembers);
            return {error: false, message: "Party members successfully retrieved"};
        }
    }
    
    // Press leave button
    const handleLeave = async () => {
        const partyID = await getData('partyID');
        const userID = await getData('userID');

        if (!partyID.error && !userID.error) {
            //const socketConnection = await joinParty(userID.data, partyID.data);
            await partySocket.disconnect();
            setPartySocket();
            console.log('Party left.');
        } else {

        }
        
        removeData('partyID');
        setPartyList([]);
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
        await storeData('partyID', partyID);
        
        const joinPartyData = await getPartyList();

        if (joinPartyData.error) {
            removeData('partyID');
        }

        setPartySearch("");
    };

    useEffect(() => {
        getPartyList();

    }, []);

    return (
        <SafeAreaView style={styles.safeContainer}>
            
            {/* Top Button Row */}

            <View style={styles.topButtons}>
                {/* <Box style={{ backgroundColor: data.colors.red}} onPress={handleLeave}>Leave</Box> */}
                <Box source={data.images.searchIcon} onPress={handleSearch}>Search</Box>
                <Box source={data.images.inviteButtonIcon} onPress={handleInvite}>Invite</Box>
            </View>

            {/* List of party members */}

            <View style={styles.wrapper}>
                <FlatList 
                    data={partyList}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.userID}>
                                <Image source={data.images.defaultAvatar} style={styles.cardImage}/>
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
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric" 
                                placeholder='Party ID'
                                value={partySearch}
                                onChangeText={setPartySearch}
                            />
                            <Box style={{width: 150, height: 50, justifyContent: 'center'}} textStyle={{fontSize: 16, paddingBottom: 0}} onPress={() => handleJoinParty(partySearch)}>Join Party</Box>
                        </View>
                    }
                    ListHeaderComponent={
                        partyList.length > 0 ? ( // Only show header when there's data
                            <View style={{flex:1}}>
                                <View style={styles.listHeaderContainer}>
                                    <Text style={styles.listHeaderText}>Party Members</Text>
                                    <Box 
                                        style={{ backgroundColor: data.colors.red, width: 70, height: 30, justifyContent: 'center'}} 
                                        textStyle={{ fontSize: 16, paddingBottom: 0 }} 
                                        onPress={handleLeave}
                                    >
                                        Leave
                                    </Box>
                                </View>  
                                <Text style={styles.listHeaderText}>PartyID: {partyID}</Text>
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
                updateParty={getPartyList}
                setPartySocket={setPartySocket}
            ></UserInviteScreen>
        </SafeAreaView>
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
        backgroundColor: data.colors.offWhite,
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
    listHeaderContainer: {
        flex: 1,
        justifyContent: "space-between",
        flexDirection: 'row',
        paddingBottom: 16
    },
    listEmptyContainer: {
        flex: 1,
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        rowGap: 20,
    },
    textInput: {
        width: 150,
        height: 50,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 5
    },
});

export default PartyScreen;