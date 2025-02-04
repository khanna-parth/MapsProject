import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';

import { getNearbyPlaces } from '../utils/mapUtils.js';

import data from '../utils/defaults/assets.js'
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const NavScreen = () => {
    const [location, setLocation] = useState(null);
    const [places, setPlaces] = useState([null]);
    const [showNewButtons, setShowNewButtons] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const snapPoints = useMemo(() => ['25%', '50%', '90%'], [])
    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleSheetChanges = useCallback((index) => {
        console.log('handleSheetChanges', index);
    }, []);

    const fetchPlaces = async (latitude, longitude) => {
        const placeData = await getNearbyPlaces(latitude, longitude);

        if (!placeData.error) {
            setPlaces(placeData.data);
        }
    }

    const updateETA = () => {
        
    }

    const endRoute = () => {
        console.log("Ending Route")
    }

    useEffect(() => {
        let locationSubscription = null;

        const requestLocationPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(currentLocation.coords);

            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 100,
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
                }
            );
        }

        requestLocationPermission();

        // Stop watching location updates
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (location) {
            //fetchPlaces(location.latitude, location.longitude);
        }
    }, [location]);

    if (!location || !places[0]) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" animating={true}/>
            </SafeAreaView>
        )
    }

    return (
        <View style={styles.container}>

            <MapView 
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsPointsOfInterest={false}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {places.map((place, index) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: place.coordinates.lat,
                            longitude: place.coordinates.long,
                        }}
                        title={place.address}
                    />
                ))}
            </MapView>
            
            <GestureHandlerRootView style={styles.swipeUpContainer}>
                <BottomSheet
                    useRef={bottomSheetRef}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    index={0}
                    enablePanDownToClose={false}
                >
                    <BottomSheetView style={styles.swipeUpContentContainer}>
                        {/* Static values for now :) */}
                        <Text style={styles.topLeftText}>ETA: 12:00 AM</Text>
                        <Text style={styles.topRightText}>12 Hours 5 Minutes</Text>
                        

                        <View style={styles.buttonContainer}>
                            {showNewButtons ? (
                                <>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewButtons(prev => !prev)}>
                                        <Text style={styles.endButtonText}>Cancel</Text>
                                    </TouchableOpacity> 
                                    <TouchableOpacity style={styles.endButton} onPress={endRoute}>
                                        <Text style={styles.endButtonText}>End Route</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.button} onPress={() => setShowNewButtons(prev => !prev)}>
                                        <Icon name="times" size={40} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.button} onPress={() => console.log("Waypoint Pressed")}>
                                        <Icon name="map-marker" size={35} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.button} onPress={() => console.log("Walkie Pressed")}>
                                        <Icon name="microphone" size={30} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.button} onPress={() => console.log("Friends Pressed")}>
                                        <Icon name="users" size={30} color="white" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </BottomSheetView>
                </BottomSheet>
            </GestureHandlerRootView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    notificationBar: {
        width: '100%',
        backgroundColor: '#333',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    notificationText: {
        color: 'white',
        fontSize: 14,
    },
    swipeUpContainer: {
        flex: 1,
        position: 'relative',
    },
    swipeUpContentContainer: {
        flex: 1,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
        paddingHorizontal: 10,
        gap: 10,
    },
    button: {
        width: 80,
        height: 80,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    endButton: {
        width: 190,
        height: 80,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    endButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    cancelButton: {
        width: 190,
        height: 80,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    topLeftText: {
        position: 'absolute',
        left: 10,
        fontSize: 15,
        color: 'black',
        zIndex: 1000,
    },
    topRightText: {
        position: 'absolute',
        right: 10,
        fontSize: 15,
        color: 'black',
        zIndex: 1000,
    },
})

export default NavScreen;
