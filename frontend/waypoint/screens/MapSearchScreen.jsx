import { ActivityIndicator, Text, FlatList, TouchableWithoutFeedback, StyleSheet, View, TextInput, Dimensions, TouchableOpacity, Keyboard, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import Icon from 'react-native-vector-icons/AntDesign'

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';

import Box from '../components/Box';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import data from '../utils/defaults/assets.js';
import { postRequest } from '../utils/utils.js';

const { width, height } = Dimensions.get('window');

const Map = ({startupPin, setLocationClicked}) => {
    const navigation = useNavigation();

    const { partySocket } = useGlobalState();
    const markerRef = useRef(null);
    const [region, setRegion] = useState(null);

    const handleAddWaypoint = () => {
        if (partySocket) {
            partySocket.emit('add-destination', startupPin);
            // navigation.navigate('Navigation', { coordinates: startupPin.coordinates });
        }
    };

    // User doesn't want that waypoint
    const handleCancel = () => {
        setLocationClicked(null);
    };

    // Ensure camera location is in correct spot
    useEffect(() => {
        if (startupPin.coordinates) {
            setRegion({
                latitude: startupPin.coordinates.lat - 0.0006,
                longitude: startupPin.coordinates.long,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    }, [startupPin.coordinates]);

    // Select pin on startup
    useEffect(() => {
        if (markerRef.current) {
            setTimeout(() => markerRef.current.showCallout(), 300);
        }
    }, [region]);
    
    return (
        <View style={mapStyles.map}>
            {region && (
                <MapView 
                    style={mapStyles.map}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    showsPointsOfInterest={true}
                    showsCompass={false}
                    initialRegion={region}
                >
                    <Marker
                        ref={markerRef}
                        key={startupPin.name}
                        coordinate={{
                            latitude: startupPin.coordinates.lat,
                            longitude: startupPin.coordinates.long,
                        }}
                        title={startupPin.name}
                        pinColor={data.colors.primaryColor}
                    />
                </MapView>
            )}
            <View style={mapStyles.pinContainer}>
                <Text style={mapStyles.markerText}>{startupPin.name}</Text>
                <Text style={mapStyles.markerSubtext}>{startupPin.address}</Text>
                <View style={mapStyles.buttonRow}>
                    <Box style={{height: 60, backgroundColor: data.colors.red}} onPress={handleCancel}>Cancel</Box>
                    <Box style={{height: 60, width: 180}} onPress={handleAddWaypoint}>Add Waypoint</Box>
                </View>
            </View>
        </View>
    );
};

const Searchbar = () => {
    const navigation = useNavigation();

    const { userLocation } = useGlobalState();
    const [searchString, setSearchString] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [placeList, setPlaceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [locationPinClicked, setLocationClicked] = useState(null);

    // User pressed enter, or waited on search. Searches for places.
    const handleReturnPress = async () => {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        setIsLoading(true);

        const searchData = await postRequest('routing/search', {query: searchString, lat: userLocation.latitude, long: userLocation.longitude});

        if (!searchData.error) {
            
            let returnData = [];

            // Check once latitude and longitude are added
            for (let i = 0; (i < searchData.data.places.data.places.length && i < 5); i++) {
                let temp = searchData.data.places.data.places[i];
                temp['cardID'] = i;
                returnData.push(temp)
            }
            
            setPlaceList(returnData)
        } else {
            setPlaceList([]);
        }

        setIsLoading(false);
        setTypingTimeout(null);
    }

    // Use touches x icon
    const exitIconPressed = () => {
        setSearchString("");
        Keyboard.dismiss();
        navigation.goBack();
    }

    // User is typing or made a change to search text
    const searchInputChange = (text) => {
        setSearchString(text);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
            setTypingTimeout(null);
        }

        setIsLoading(true);

        // Create a timeout to make sure user done typing
        if (searchString.length >= 3) {
            const timeout = setTimeout(() => {
                handleReturnPress();
            }, 2000);
    
            setTypingTimeout(timeout);
        } else {
            setPlaceList([]);
            setIsLoading(false);
        }
    }

    // User clicked on destination
    const destinationPressed = (locationInfo) => {
        console.log(locationInfo)
        Keyboard.dismiss();
        setLocationClicked(locationInfo);
        // partySocket.emit('add-destination', locationInfo);
        //navigation.navigate('Navigation', { coordinates: coordinates });
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View 
                style={styles.searchContainer}
            >
                <TextInput 
                    style={styles.textInput} 
                    placeholder='Search'
                    value={searchString}
                    onChangeText={searchInputChange}
                    onSubmitEditing={handleReturnPress}
                    autoFocus={true}
                />
                <TouchableOpacity onPress={exitIconPressed}>
                    <Icon name='close' size={25} color='black'/>
                </TouchableOpacity>
            </View>
            <TouchableWithoutFeedback style={styles.notSearch} onPressIn={() => Keyboard.dismiss()}>
                <View style={[styles.notSearch, styles.wrapper]}>
                <FlatList 
                    style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 16 }}
                    contentContainerStyle={{ flexGrow: 1, padding: 0 }}
                    data={placeList}
                    renderItem={({ item }) => {
                        return (
                            <TouchableOpacity onPress={() => destinationPressed({name: item.name, address: item.address, coordinates: item.coordinates})}>
                                <View style={styles.card} key={item.cardID}>
                                    <View style={styles.cardTextArea} key={item.cardID}>
                                        <Text style={styles.cardText}>{item.name}</Text>
                                        <Text style={styles.cardSubtext}>{item.address}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.cardID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                    ListEmptyComponent={
                        isLoading ? (
                            <View style={styles.listEmptyContainer}>
                                <View style={{height: '75%', justifyContent: 'center'}}>
                                    <ActivityIndicator size="large" animating={true}/>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.listEmptyContainer}>
                                <View style={{height: '75%', justifyContent: 'center'}}>
                                    <Icon style={{alignSelf: 'center', paddingBottom: 8}} name='search1' size={100} color='#dddddd' />
                                    <Text style={styles.instructionText}>No Places Found</Text>
                                </View>
                            </View>
                        )
                    }
                    ListHeaderComponent={
                        placeList.length > 0 ? ( // Only show header when there's data
                            <View style={{flex:1}}>
                                <Text style={styles.listHeaderText}>Places</Text>
                            </View> 
                        ) : null  
                    }
                />
                </View>
            </TouchableWithoutFeedback>
            {locationPinClicked && (<Map startupPin={locationPinClicked} setLocationClicked={setLocationClicked}/>)}
        </SafeAreaView>
    );
}

const mapStyles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    pinContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 170,
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: data.colors.offWhite,
        borderRadius: 25,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10, 
    },
    buttonRow: {
        justifyContent: "space-evenly",
        flexDirection: 'row',
        paddingBottom: 16,
        paddingTop: 5
    },
    markerText: {
        alignSelf: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 2,
    },
    markerSubtext: {
        alignSelf: 'center',
        color: '#999',
        fontSize: 16,
        paddingBottom: 8,
    },
});

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
    searchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: width - 32,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    searchImage: {
        width: 20,
        height: 20
    },
    textInput: {
        height: '100%',
        width: (width - (width*.15)) - 30,
        //backgroundColor: 'white',
        fontSize: 18,
    },
    notSearch: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextArea: {
        flex: 1,
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
    cardText: {
        fontSize: 20,
        paddingBottom: 2,
    },
    cardSubtext: {
        color: '#999',
        fontSize: 12
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
    listHeaderText: {
        fontSize: 20,
        marginVertical: 12,
    },
    cardPlusImage: {
        width: 25,
        height: 25,
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

export default Searchbar;
