import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import Icon from 'react-native-vector-icons/Ionicons'
import Icon2 from 'react-native-vector-icons/AntDesign'

import data from '../utils/defaults/assets.js'
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';
import { getUserFriends, getUsers } from '../utils/userUtils.js';

function SearchScreen({ visible, onRequestClose }) {
    const [username, setUsername] = useState("");
    const [searchList, setSearchList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userFriends, setUserFriends] = useState([]);
    const [currentUserName, setCurrentUserName] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Load current user and their friends when modal opens
    useEffect(() => {
        if (visible) {
            loadCurrentUserAndFriends();
        }
    }, [visible]);

    const loadCurrentUserAndFriends = async () => {
        try {
            const currentUser = await getData('username');
            if (!currentUser.error) {
                setCurrentUserName(currentUser.data);
                
                // Get friends of logged in user
                const friendData = await getUserFriends(currentUser.data);
                
                let friends = [];
                if (!friendData.error && friendData.data) {
                    for (let i = 0; i < friendData.data.length; i++) {
                        friends.push(friendData.data[i].username);
                    }
                }
                setUserFriends(friends);
                
                // Here we could also load pending requests if the API supports it
                // For now, we'll just use local state to track requests made in this session
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    // Debounce search with useEffect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (username.length > 0) {
                performSearch(username);
            } else {
                setSearchList([]);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [username]);

    const performSearch = async (searchText) => {
        if (searchText.length === 0) {
            setSearchList([]);
            return;
        }

        setIsLoading(true);
        try {
            // Get search results
            const searchData = await getUsers(String(searchText));

            if (!searchData.error && searchData.data) {
                let returnData = [];

                for (let i = 0; i < searchData.data.length; i++) {
                    if (searchData.data[i] !== currentUserName) {
                        returnData.push({
                            username: searchData.data[i], 
                            cardID: i, 
                            isFriend: userFriends.includes(searchData.data[i]),
                            requestSent: pendingRequests.includes(searchData.data[i])
                        });
                    }
                }
                
                setSearchList(returnData);
            } else {
                setSearchList([]);
                console.error("Search error:", searchData.message);
            }
        } catch (error) {
            console.error("Error during search:", error);
            setSearchList([]);
        } finally {
            setIsLoading(false);
        }
    };

    const searchInputChange = (searchText) => {
        setUsername(searchText);
    };

    const addButtonPressed = async (addedUser) => {
        try {
            if (!currentUserName) {
                const currentUser = await getData('username');
                if (currentUser.error) {
                    console.error("Error retrieving username");
                    return;
                }
                setCurrentUserName(currentUser.data);
            }

            setIsLoading(true);
            const response = await postRequest('social/add', {
                username: currentUserName, 
                friendUsername: addedUser
            });
            
            if (!response.error) {
                // Add to pending requests
                setPendingRequests(prev => [...prev, addedUser]);
                
                // Update the search results to reflect the request status
                setSearchList(prev => 
                    prev.map(user => 
                        user.username === addedUser 
                            ? {...user, requestSent: true} 
                            : user
                    )
                );
            }
        } catch (error) {
            console.error("Error adding friend:", error);
        } finally {
            setIsLoading(false);
        }
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
                    <View style={styles.searchContainer}>
                        <TextInput 
                            style={styles.textInput} 
                            placeholder='Search'
                            value={username}
                            onChangeText={searchInputChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {isLoading && (
                            <ActivityIndicator 
                                style={styles.searchLoader} 
                                size="small" 
                                color="#999" 
                            />
                        )}
                    </View>
                    <FlatList 
                        style={{ flex: 1, position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, paddingHorizontal: 16 }}
                        contentContainerStyle={{ flexGrow: 1, padding: 0 }}
                        data={searchList}
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.card} key={item.cardID}>
                                    <Image source={data.images.defaultAvatar} style={styles.cardImage}/>
                                    <View style={styles.cardTextArea} key={item.cardID}>
                                        <Text style={styles.cardText}>{item.username}</Text>
                                        {!item.isFriend && !item.requestSent && (
                                            <TouchableOpacity onPress={() => addButtonPressed(item.username)}>
                                                <Icon2 name='adduser' size={25} color='black' style={styles.cardPlusImage}/>
                                            </TouchableOpacity>
                                        )}
                                        {item.requestSent && (
                                            <View style={styles.sentContainer}>
                                                <Text style={styles.sentText}>Sent</Text>
                                            </View>
                                        )}
                                        {item.isFriend && (
                                            <Icon2 name='check' size={25} color='green' style={styles.cardPlusImage}/>
                                        )}
                                    </View>
                                </View>
                            );
                        }}
                        horizontal={false}
                        keyExtractor={(item) => item.cardID.toString()}
                        ItemSeparatorComponent={<View style={{ height: 16 }} />}
                        ListEmptyComponent={
                            username ? (
                                <View style={styles.listEmptyContainer}>
                                    <View style={{height: '75%', justifyContent: 'center'}}>
                                        <Icon2 style={{alignSelf: 'center', paddingBottom: 8}} name='deleteuser' size={100} color='#dddddd' />
                                        <Text style={styles.instructionText}>No Users Found</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.listEmptyContainer}>
                                    <View style={{height: '75%', justifyContent: 'center'}}>
                                        <Icon2 style={{alignSelf: 'center', paddingBottom: 8}} name='user' size={100} color='#dddddd' />
                                        <Text style={styles.instructionText}>Search for User</Text>
                                    </View>
                                </View>
                            )
                        }
                        ListHeaderComponent={
                            searchList.length != 0 && (
                                <Text style={styles.listHeaderText}>Users</Text>
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
    searchContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    textInput: {
        height: 40,
        backgroundColor: 'white',
        padding: 10,
        paddingRight: 40,
        borderRadius: 20,
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    searchLoader: {
        position: 'absolute',
        right: 15,
        top: 10,
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
    sentContainer: {
        backgroundColor: '#e6e6e6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-end',
    },
    sentText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
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
        fontSize: 20,
    },
});

export default SearchScreen;