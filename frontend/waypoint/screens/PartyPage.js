import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';

import Box from '../components/Box';
import SearchScreen from './Search.js';
import InviteScreen from './Invite.js';
import data from '../utils/defaults/defaultColors.js'
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';

const defaultImage = require("../assets/default-avatar-icon.jpg")

import { useNavigation } from '@react-navigation/native';



function PartyScreen() {
    const test = async () => {
        console.log(await postRequest('auth/login', {username: "admin", password: "admin"}))
    }
    //test()
    
    const navigation = useNavigation();

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);

    const [partyList, setPartyList] = useState([]);
    const [inviteList, setInviteList] = useState([]);
    
    
    const getPartyList = async () => {
        const userID = await getData("userID");
        const partyID = await getData("partyID");

        if (userID.error || partyID.error) {
            return {error: true, message: "Error retrieving user or party ID."}
        } else if (!partyID) {
            return {error: true, message: "User not in party."}
        }
        
        console.log(await postRequest('party/status', {userID: userID, partyID: partyID}))
    }

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

    // useEffect(() => {
    //     const fetchData = async () => {
    //         const data = await getPartyList();

    //         if (!data.error) {
    //             setPartyList(data.connected);
    //         }
    //     };
        
    //     //fetchData();
    // }, []);

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
                    //data={partyList} fix when backend fixed
                    data={[{ "userID": "7", "username": "Theo" }, { "userID": "8", "username": "Collin" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.userID}>
                                <Image source={defaultImage} style={styles.cardImage}/>
                                <View style={styles.cardTextArea} key={item.userID}>
                                    <Text style={styles.cardText}>{item.username}</Text>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.userID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                />
            </View>

            {/* Search Screen */}

            <SearchScreen 
                visible={searchModalVisible} 
                onRequestClose={() => {
                    setSearchModalVisible(false);
                }} 
            ></SearchScreen>
            

            {/* Invite Screen */}

            <InviteScreen 
                visible={inviteModalVisible} 
                onRequestClose={() => {
                    setInviteModalVisible(false);
                }} 
            ></InviteScreen>
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