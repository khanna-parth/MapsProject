import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons'

import data from '../utils/defaults/assets.js'
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends, getUsers } from '../utils/userUtils.js';

function SearchScreen({ visible, onRequestClose }) {
    const [username, setUsername] = useState("");
    const [searchList, setSearchList] = useState([]);

    const searchInputChange = async (searchText) => {
        setUsername(searchText);
        
        if (searchText.length >= 3) {
            const currentUser = await getData('username');

            // Get friends of logged in user
            const friendData = await getUserFriends(currentUser.data);
            
            let userFriends = [];
            if (!friendData.error) {
                for (let i = 0; i < friendData.data.length; i++) {
                    userFriends.push(friendData.data[i].username);
                }
            }

            // Get search results
            const searchData = await getUsers(String(searchText));

            if (!searchData.error) {
                let returnData = []

                for (let i = 0; i < searchData.data.length; i++) {
                    if (searchData.data[i] !== currentUser.data) {
                        returnData.push({username: searchData.data[i], cardID: i, isFriend: userFriends.includes(searchData.data[i])})
                    }
                }
                
                setSearchList(returnData);
            } else {
                setSearchList([]);
            }
        } else {
            setSearchList([]);
        }
    };

    const addButtonPressed = async (addedUser) => {
        const currentUser = await getData('username');

        if (currentUser.error) {
            return {error: true, message: "Error retrieving username."}
        }

        await postRequest('social/add', {username: currentUser.data, friendUsername: addedUser});

        searchInputChange(username);
    };

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
                    <Text style={styles.modalTitle}>Search for User</Text>
                    <TextInput 
                        style={styles.textInput} 
                        placeholder='Search'
                        value={username}
                        onChangeText={searchInputChange}
                    />
                        <FlatList 
                            style={{ position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, paddingHorizontal: 16 }}
                            data={searchList}
                            renderItem={({ item }) => {
                                return (
                                    <View style={styles.card} key={item.cardID}>
                                        <Image source={data.images.defaultAvatar} style={styles.cardImage}/>
                                        <View style={styles.cardTextArea} key={item.cardID}>
                                            <Text style={styles.cardText}>{item.username}</Text>
                                            {!item.isFriend && (
                                                <TouchableOpacity onPress={() => addButtonPressed(item.username)}>
                                                    <Image source={data.images.addFriendIcon} style={styles.cardPlusImage}/>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                            horizontal={false}
                            keyExtractor={(item) => item.cardID.toString()}
                            ItemSeparatorComponent={<View style={{ height: 16 }} />}
                            ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 20}}>No Users Founds</Text>}
                            ListHeaderComponent={
                                searchList.length != 0 && (
                                    <Text style={styles.listHeaderText}>Users</Text>
                                )
                            }
                            contentContainerStyle={{ padding: 0 }}
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
        borderRadius: 20,
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
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
        shadowColor: 'black',
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
        width: 25,
        height: 25,
        alignSelf: 'flex-end'
    },
});

export default SearchScreen;