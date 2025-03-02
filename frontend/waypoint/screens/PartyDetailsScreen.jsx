import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';

import { useGlobalState } from '../components/global/GlobalStateContext';
import { postRequest, getData, storeData } from '../utils/utils';
import { getUserProfilePicture } from '../utils/userUtils';
import { getSyncedData, storeSyncedData } from '../utils/syncStorage';
import data from '../utils/defaults/assets';

const { width, height } = Dimensions.get('window');

const PartyDetailsScreen = () => {
  const navigation = useNavigation();
  const { partySocket, partyMemberLocation, userPartyChange, setUserPartyChange } = useGlobalState();
  
  const [partyMembers, setPartyMembers] = useState([]);
  const [partyID, setPartyID] = useState('');
  const [partyHost, setPartyHost] = useState('');
  const [sharedDestinations, setSharedDestinations] = useState([]);
  const [currentDestination, setCurrentDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberProfilePics, setMemberProfilePics] = useState({});

  // Animation values
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPartyDetails();
    
    if (partySocket) {
      // Listen for shared destinations updates
      partySocket.on('shared-destinations', (data) => {
        try {
          const parsedData = JSON.parse(data.replace('SYSTEM: ', ''));
          setSharedDestinations(parsedData.destinations || []);
          setCurrentDestination(parsedData.currentDestination || null);
        } catch (error) {
          console.error('Error parsing shared destinations:', error);
        }
      });
      
      // Listen for connections updates
      partySocket.on('connections', () => {
        fetchPartyDetails();
      });
    }
    
    return () => {
      if (partySocket) {
        partySocket.off('shared-destinations');
        partySocket.off('connections');
      }
    };
  }, [partySocket, userPartyChange]);

  const loadMemberProfilePictures = async (members) => {
    if (!members || !Array.isArray(members) || members.length === 0) return;
    
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

  const fetchPartyDetails = async () => {
    setIsLoading(true);
    try {
      const userID = await getData("userID");
      const partyIDData = await getData("partyID");

      if (userID.error || partyIDData.error || !partyIDData.data) {
        setIsLoading(false);
        return;
      }

      const partyData = await postRequest('party/status', {
        userID: userID.data, 
        partyID: partyIDData.data
      });

      if (partyData.error) {
        setIsLoading(false);
        return;
      }

      setPartyID(partyIDData.data);
      setPartyHost(partyData.data.host || '');
      
      // Create member objects with initial data
      const members = partyData.data.connected.map(member => {
        // Extract first name from username
        const firstName = extractFirstName(member.username);
        
        return {
          username: member.username,
          firstName: firstName,
          userID: member.userID,
          isHost: member.username === partyData.data.host,
          location: partyMemberLocation.find(loc => loc.username === member.username)?.location || null,
          profilePicture: memberProfilePics[member.username] || null
        };
      });
      
      // Set members immediately with any cached profile pics
      setPartyMembers(members);
      
      // Load profile pictures in the background
      const membersWithPics = await loadMemberProfilePictures(members);
      if (membersWithPics) {
        setPartyMembers([...membersWithPics]);
      }
      
      // Request shared destinations if not already received
      if (partySocket && (!sharedDestinations || sharedDestinations.length === 0)) {
        partySocket.emit('get-shared-destinations');
      }
    } catch (error) {
      console.error('Error fetching party details:', error);
    } finally {
      setIsLoading(false);
      setUserPartyChange(false);
    }
  };

  const handleLeaveParty = async () => {
    try {
      const userID = await getData("userID");
      if (userID.error) return;
      
      await postRequest('party/leave', { userID: userID.data, partyID });
      
      if (partySocket) {
        partySocket.disconnect();
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  const handleSetCurrentDestination = (destinationId) => {
    if (partySocket) {
      partySocket.emit('set-current-destination', destinationId);
    }
  };

  const renderMemberItem = ({ item, index }) => {
    // Use the profile picture from the memberProfilePics state if available
    const profilePic = memberProfilePics[item.username] || item.profilePicture;
    
    return (
      <View style={styles.memberCard}>
        <LinearGradient
          colors={item.isHost ? ['#FFD700', '#FFA500'] : ['#3498db', '#2980b9']}
          style={styles.memberCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.memberCardContent}>
            <View style={styles.memberAvatarContainer}>
              {profilePic ? (
                <Image 
                  source={{ uri: profilePic }} 
                  style={styles.memberAvatar} 
                />
              ) : (
                <View style={styles.memberAvatarFallback}>
                  <FontAwesome name="user-alt" size={16} color="#fff" />
                </View>
              )}
              {item.isHost && (
                <View style={styles.hostBadge}>
                  <FontAwesome name="crown" size={7} color="#FFA500" />
                </View>
              )}
            </View>
            
            <View style={styles.memberTextContainer}>
              <Text style={styles.memberUsername} numberOfLines={1}>{item.firstName || item.username}</Text>
              
              <View style={styles.memberStatusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: item.location ? '#4CAF50' : '#FF9800' }]} />
                <Text style={styles.memberStatus}>
                  {item.location ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderDestinationItem = ({ item, index }) => {
    const isActive = currentDestination && currentDestination.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.destinationItem, isActive && styles.activeDestinationItem]}
        onPress={() => handleSetCurrentDestination(item.id)}
      >
        <View style={styles.destinationIconContainer}>
          <FontAwesome 
            name={isActive ? "map-marker-alt" : "map-marker"} 
            size={20} 
            color={isActive ? "#FF5252" : "#757575"} 
          />
        </View>
        <View style={styles.destinationDetails}>
          <Text style={[styles.destinationName, isActive && styles.activeDestinationText]} numberOfLines={1}>
            {item.name || 'Unnamed location'}
          </Text>
          <Text style={styles.destinationAddress} numberOfLines={1}>
            {item.address || 'No address available'}
          </Text>
        </View>
        {isActive && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={data.colors.primaryColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Party Details</Text>
        <TouchableOpacity onPress={handleLeaveParty} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>
      
      {/* Party Info */}
      <View style={styles.partyInfoContainer}>
        <View style={styles.partyIDContainer}>
          <Text style={styles.partyIDLabel}>Party ID:</Text>
          <Text style={styles.partyIDValue}>{partyID}</Text>
        </View>
        <View style={styles.partyHostContainer}>
          <Text style={styles.partyHostLabel}>Host:</Text>
          <Text style={styles.partyHostValue}>{partyHost}</Text>
        </View>
      </View>
      
      {/* Party Members */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Party Members ({partyMembers.length})</Text>
        
        <FlatList
          data={partyMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.userID || item.username}
          horizontal={false}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.membersList}
        />
      </View>
      
      {/* Tracking Bar */}
      <View style={styles.trackingContainer}>
        <View style={styles.trackingHeader}>
          <Text style={styles.trackingTitle}>Destinations</Text>
          <View style={styles.trackingStats}>
            <Text style={styles.trackingStatsText}>
              {sharedDestinations.length} stops • {currentDestination ? '1 active' : 'None active'}
            </Text>
          </View>
        </View>
        
        {sharedDestinations.length > 0 ? (
          <FlatList
            data={sharedDestinations}
            renderItem={renderDestinationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.destinationsList}
          />
        ) : (
          <View style={styles.emptyDestinationsContainer}>
            <FontAwesome name="map-signs" size={40} color="#BDBDBD" />
            <Text style={styles.emptyDestinationsText}>No destinations added yet</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#212121',
  },
  leaveButton: {
    padding: 8,
  },
  leaveButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  partyInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partyIDContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partyIDLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
    marginRight: 8,
  },
  partyIDValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  partyHostContainer: {
    flexDirection: 'row',
  },
  partyHostLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
    marginRight: 8,
  },
  partyHostValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    marginBottom: 12,
  },
  membersList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  memberCard: {
    width: (width - 52) / 3,
    height: 115,
    margin: 4,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberCardGradient: {
    flex: 1,
    padding: 8,
  },
  memberCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberAvatarFallback: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberTextContainer: {
    alignItems: 'center',
  },
  hostBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  memberUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    width: 75,
  },
  memberStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 3,
  },
  memberStatus: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  trackingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trackingTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#212121',
  },
  trackingStats: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trackingStatsText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  destinationsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activeDestinationItem: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  destinationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  destinationDetails: {
    flex: 1,
  },
  destinationName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  activeDestinationText: {
    color: '#4CAF50',
  },
  destinationAddress: {
    fontSize: 13,
    color: '#757575',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyDestinationsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyDestinationsText: {
    fontSize: 17,
    color: '#9E9E9E',
    marginTop: 12,
  },
});

export default PartyDetailsScreen; 