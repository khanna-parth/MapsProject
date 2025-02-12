import { StyleSheet, View, SafeAreaView, ActivityIndicator, Keyboard, Pressable } from 'react-native'
import React, { useState, useEffect, useRef } from 'react';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import data from '../utils/defaults/assets.js'
import { useGlobalState } from './GlobalStateContext';
import { getNearbyPlaces, getDistance } from '../utils/mapUtils.js';
import { getData } from '../utils/utils.js';

import Button from '../components/Button.jsx'

const Map = () => {
    const { userLocation, setUserLocation, partySocket } = useGlobalState();
    const mapRef = useRef(null);
    const [cameraDirection, setCameraDirection] = useState(0);

    const [places, setPlaces] = useState([null]);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const locationTimeout = useRef(null);

    // Location stuff
    useEffect(() => {
        let locationSubscription = null;

        const requestLocationPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            // Initial location
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setUserLocation(currentLocation.coords);
            setPreviousLocation(currentLocation.coords);

            // Location updates
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000, // 1 sec
                    distanceInterval: 1, // Moved 1m
                },
                (newLocation) => {
                    setUserLocation(newLocation.coords);
                    //setPreviousLocation(currentLocation.coords);
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

    // Get places from coordinates
    const fetchPlaces = async(latitude, longitude) => {
        //const placeData = await getNearbyPlaces(latitude, longitude); // Uncomment when done
        const placeData = {error: false, data: [{address: "Pizza My Heart", coordinates: {lat: 36.972285, long: -122.02541699999999}, details: {formattedAddress: "1116 Pacific Ave, Santa Cruz, CA 95060, USA", primaryType: "pizza_restaurant", types: ["pizza_restaurant", "italian_restaurant", "meal_takeaway", "restaurant", "food", "point_of_interest", "establishment"]}}]}

        if (!placeData.error) {
            setPlaces(placeData.data);
        }
    };
    
    // When camera moves
    const handleRegionChangeComplete = async (region) => {
        const distance = getDistance(
            previousLocation.latitude,
            previousLocation.longitude,
            region.latitude,
            region.longitude
        );

        const threshold = 5000; // Meters

        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

        // If user made large enough change on map
        if (distance > threshold) {
            const newTimeoutID = setTimeout(() => {
                fetchPlaces(region.latitude, region.longitude);
                setPreviousLocation({ latitude: region.latitude, longitude: region.longitude });
                console.log('map updated');
            }, 1000); // Wait 1 second

            setTimeoutId(newTimeoutID);
        } 
        // If user just sitting there
        else if (distance > 800) {
            const newTimeoutID = setTimeout(() => {
                fetchPlaces(region.latitude, region.longitude);
                setPreviousLocation({ latitude: region.latitude, longitude: region.longitude });
                console.log('user waited and updated');
            }, 5000); // Wait 5 seconds

            setTimeoutId(newTimeoutID);
        }
    };

    const locationPressed = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }, 1000);
        }
    }

    // Reset camera to north
    const resetToNorth = () => {
        if (mapRef.current) {
            mapRef.current.animateCamera({ heading: 0 }, 500);
            setCameraDirection(0);
        }
    };

    // Send location every 5 seconds if updated
    useEffect(() => {
        const sendLocation = async () => {
            const currentUsername = await getData('username');
            
            partySocket.emit('location', {
                username: currentUsername.data,
                lat: userLocation.latitude,
                long: userLocation.longitude
            });
        }

        if (userLocation) {
            fetchPlaces(userLocation.latitude, userLocation.longitude);
        }

        if (partySocket) {
            if (!locationTimeout.current) {
                sendLocation();
        
                // Prevent further calls for 5 seconds
                locationTimeout.current = setTimeout(() => {
                    locationTimeout.current = null; // Reset after timeout
                }, 5000);
            }
        }

    }, [userLocation]);

    // Get locations sent by other users
    useEffect(() => {
        if (partySocket) {
            const handleLocationUpdate = (socketData) => {
                console.log('Received location update:', socketData);
            };
    
            partySocket.on("location", handleLocationUpdate);
    
            return () => {
                partySocket.off("location", handleLocationUpdate);
            };
        }
    }, [partySocket]);

    // Display loading screen while waiting for location
    if (!userLocation || !places[0]) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1000, width: '100%', height: '100%' }}>
                <ActivityIndicator size="large" animating={true}/>
            </SafeAreaView>
        )
    }

    return (
        <Pressable style={{...StyleSheet.absoluteFillObject,}} onPress={() => Keyboard.dismiss()}>
            <View style={styles.map}>
                <MapView 
                    style={styles.map}
                    ref={mapRef}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    //showsMyLocationButton={true}
                    showsPointsOfInterest={true}
                    showsCompass={false}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                    onRegionChange={async () => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            setTimeoutId(null);
                        }

                        // Camera direction
                        if (mapRef.current) {
                            const camera = await mapRef.current.getCamera();
                            setCameraDirection(camera.heading);
                        }
                    }}
                    onRegionChangeComplete={handleRegionChangeComplete}
                >
                    {
                    places.map((place, index) => (
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
                <Button icon="location-arrow" iconColor="white" style={{bottom: 150, right: 10}} functionCall={locationPressed}/>
                {cameraDirection < 355 && cameraDirection > 5 && (
                    <Button icon="compass" iconColor="white" style={{bottom: 220, right: 10}} functionCall={resetToNorth} />
                )}
            </View>
        </Pressable>
    )
};

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    locationButton: {
        position: 'absolute',
        right: 10,
        top: 120,
        width: 50,
        height: 50,
        backgroundColor: data.colors.primaryColor,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    compassButton: {
        position: 'absolute',
        right: 10,
        top: 180,
        width: 50,
        height: 50,
        backgroundColor: data.colors.primaryColor,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
});

export default Map