import { StyleSheet, View, Text, Image, FlatList, Modal, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/AntDesign';

import data from '../utils/defaults/assets.js';
import { getUserFriends, getUserProfilePicture } from '../utils/userUtils.js';
import { getData } from '../utils/utils.js';
import { getSyncedData, storeSyncedData } from '../utils/syncStorage';
import UserSearchScreen from './UserSearch';

function FriendsScreen({ visible, onRequestClose }) {
    const [friendList, setFriendList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentUserName, setCurrentUserName] = useState(null);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [error, setError] = useState(null);
    const [friendProfilePics, setFriendProfilePics] = useState({});

    // Load friends when modal opens
    useEffect(() => {
        if (visible) {
            // Reset state to ensure we don't show previous user's friend profile pictures
            setFriendProfilePics({});
            setFriendList([]);
            setError(null);
            
            loadFriends();
        }
    }, [visible]);

    // Reload friends list when search modal closes (in case new friends were added)
    useEffect(() => {
        if (!searchModalVisible && visible && currentUserName) {
            loadFriends();
        }
    }, [searchModalVisible]);

    const loadFriends = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Get current username
            const usernameData = await getData('username');
            if (usernameData.error) {
                console.error("Error retrieving username:", usernameData.message);
                setError("Could not retrieve username");
                setIsLoading(false);
                return;
            }
            
            setCurrentUserName(usernameData.data);
            
            // Try to get friends from synced storage first
            const cachedFriends = await getSyncedData('friends');
            if (cachedFriends && cachedFriends.length > 0) {
                console.log("Using cached friends data:", cachedFriends);
                setFriendList(cachedFriends);
                
                // Load profile pictures for friends
                loadFriendProfilePictures(cachedFriends);
                
                // Fetch fresh data in the background
                fetchFriendsFromServer(usernameData.data);
            } else {
                // No cached data, fetch from server
                await fetchFriendsFromServer(usernameData.data);
            }
        } catch (error) {
            console.error("Error loading friends:", error);
            setError("An unexpected error occurred");
            setFriendList([]);
            setIsLoading(false);
        }
    };
    
    const loadFriendProfilePictures = async (friends) => {
        if (!friends || !Array.isArray(friends) || friends.length === 0) return;
        
        console.log(`Loading profile pictures for ${friends.length} friends`);
        const profilePics = { ...friendProfilePics };
        let loadedCount = 0;
        
        for (const friend of friends) {
            try {
                console.log(`Attempting to load profile picture for ${friend.username}`);
                
                // Try to get profile picture for this friend
                const profilePicData = await getSyncedData(`profilePicture_${friend.username}`);
                
                if (profilePicData && profilePicData.imageUri) {
                    console.log(`Found cached profile picture for ${friend.username}`);
                    profilePics[friend.username] = profilePicData.imageUri;
                    loadedCount++;
                } else {
                    console.log(`No cached profile picture for ${friend.username}, fetching from server`);
                    // If not in local storage, try to fetch from server
                    const serverPicData = await getUserProfilePicture(friend.username);
                    
                    if (!serverPicData.error && serverPicData.data) {
                        if (serverPicData.data.imageUri) {
                            console.log(`Successfully retrieved profile picture for ${friend.username} from server`);
                            profilePics[friend.username] = serverPicData.data.imageUri;
                            loadedCount++;
                            
                            // Cache the profile picture
                            await storeSyncedData(`profilePicture_${friend.username}`, serverPicData.data);
                        } else {
                            console.log(`${friend.username} has no profile picture set`);
                            // Explicitly set to null to indicate we checked and there's no picture
                            profilePics[friend.username] = null;
                        }
                    } else {
                        console.warn(`Could not retrieve profile picture for ${friend.username}: ${serverPicData.message}`);
                        // Explicitly set to null to indicate we checked and there's no picture
                        profilePics[friend.username] = null;
                    }
                }
            } catch (error) {
                console.error(`Error loading profile picture for ${friend.username}:`, error);
                // Explicitly set to null to indicate we checked and there's no picture
                profilePics[friend.username] = null;
            }
        }
        
        console.log(`Loaded ${loadedCount} profile pictures out of ${friends.length} friends`);
        setFriendProfilePics(profilePics);
    };
    
    const fetchFriendsFromServer = async (username) => {
        try {
            setIsSyncing(true);
            
            // Get friends list from server
            const friendData = await getUserFriends(username);
            
            if (!friendData.error && friendData.data) {
                console.log("Friends data received from server:", friendData.data);
                setFriendList(friendData.data);
                
                // Store in synced storage for offline access
                await storeSyncedData('friends', friendData.data);
                
                // Load profile pictures for friends
                loadFriendProfilePictures(friendData.data);
            } else {
                console.error("Error loading friends from server:", friendData.message);
                if (!friendList.length) {
                    // Only show error if we don't have cached data
                    setError(friendData.message || "Failed to load friends");
                }
            }
        } catch (error) {
            console.error("Error fetching friends from server:", error);
            if (!friendList.length) {
                // Only show error if we don't have cached data
                setError("Failed to connect to server");
            }
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };
    
    const syncFriends = async () => {
        if (!currentUserName) return;
        
        setIsSyncing(true);
        try {
            await fetchFriendsFromServer(currentUserName);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={onRequestClose}
        >
            <StatusBar
                barStyle="light-content"
            />
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalViewContainer}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={onRequestClose}>
                            <Icon name='chevron-back' size={24} color='black' />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>My Friends</Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity 
                                style={styles.syncButton}
                                onPress={syncFriends}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <ActivityIndicator size="small" color={data.colors.primaryColor} />
                                ) : (
                                    <Icon name="sync" size={20} color="black" />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => setSearchModalVisible(true)}
                            >
                                <Icon2 name='adduser' size={24} color='black' />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={data.colors.primaryColor} />
                            <Text style={styles.loadingText}>Loading friends...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Icon2 name="exclamationcircleo" size={50} color="#ff6b6b" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={loadFriends}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {friendList.length > 0 && (
                                <Text style={styles.listHeaderText}>Friends</Text>
                            )}
                            <FlatList 
                                style={styles.flatList}
                                contentContainerStyle={styles.flatListContent}
                                data={friendList}
                                renderItem={({ item }) => {
                                    return (
                                        <View style={styles.card} key={item.cardID}>
                                            {friendProfilePics[item.username] ? (
                                                <Image 
                                                    source={{ uri: friendProfilePics[item.username] }} 
                                                    style={styles.cardImage}
                                                />
                                            ) : (
                                                <Image 
                                                    source={data.images.defaultAvatar} 
                                                    style={styles.cardImage}
                                                />
                                            )}
                                            <View style={styles.cardTextArea} key={item.cardID}>
                                                <Text style={styles.cardText}>{item.username}</Text>
                                                <TouchableOpacity>
                                                    <Icon2 name='message1' size={25} color='black' style={styles.cardActionIcon}/>
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
                                        <Icon2 style={styles.emptyIcon} name='user' size={100} color='#dddddd' />
                                        <Text style={styles.instructionText}>No Friends Found</Text>
                                        <Text style={styles.subInstructionText}>
                                            Add friends by tapping the + button
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    )}
                </View>
            </SafeAreaView>
            
            {/* Search User Modal */}
            <UserSearchScreen 
                visible={searchModalVisible}
                onRequestClose={() => setSearchModalVisible(false)}
            />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncButton: {
        width: 40,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    addButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    modalTitle: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
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
    cardActionIcon: {
        alignSelf: 'flex-end'
    },
    listEmptyContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    instructionText: {
        fontSize: 18,
        color: '#999',
        textAlign: 'center',
        marginBottom: 8,
    },
    subInstructionText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: data.colors.primaryColor,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
    },
    flatList: {
        flexGrow: 1,
    },
    flatListContent: {
        padding: 0,
    },
    emptyIcon: {
        alignSelf: 'center',
        marginBottom: 16,
    },
});

export default FriendsScreen; 