import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';

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
            onRequestClose={ onRequestClose }>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Search User</Text>
                <TextInput 
                    style={styles.textInput} 
                    placeholder='Search'
                    value={username}
                    onChangeText={searchInputChange}
                />
                    <FlatList 
                    data={searchList}
                    //data={[{ "userID": "7", "username": "Parth Khanna" }, { "userID": "8", "username": "Howard" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.cardID}>
                                <Image source={data.images.defaultImage} style={styles.cardImage}/>
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
                    ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 20,}}>No Users Founds</Text>}
                    ListHeaderComponent={<Text style={styles.listHeaderText}>Users</Text>}
                />
                {/* <Button title='Close' color={data.colors.primaryColor} onPress={() => {
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

export default SearchScreen;