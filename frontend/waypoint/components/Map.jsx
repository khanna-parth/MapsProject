import { StyleSheet, View, SafeAreaView, ActivityIndicator, Keyboard, Pressable, Image, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import data from '../utils/defaults/assets.js'
import { useGlobalState } from './global/GlobalStateContext.jsx';
import { getNearbyPlaces, getDistance } from '../utils/mapUtils.js';
import { getData } from '../utils/utils.js';

import Button from '../components/Button.jsx'

const Map = () => {
    const { currentUser, userLocation, setUserLocation, partySocket, userSentLocation, setUserSentLocation, partyMemberLocation, setPartyMemberLocation, isCameraMoving, setIsCameraMoving } = useGlobalState();
    const mapRef = useRef(null);
    const [cameraDirection, setCameraDirection] = useState(0);

    const [places, setPlaces] = useState([null]);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const locationTimeout = useRef(null);

    const opacity = useRef(new Animated.Value(isCameraMoving ? 0 : 1)).current;
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isCameraMoving ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isCameraMoving]);

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
                accuracy: Location.Accuracy.Balanced,
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

    // While camera is moving
    const handleRegionChange = async (region) => {
        if (!isCameraMoving) {
            const distance = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                region.latitude,
                region.longitude
            );
    
            const threshold = 100; // Meters

            if (distance > threshold) {
                setIsCameraMoving(true);
            } 
        }

        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

        // Camera direction
        if (mapRef.current) {
            const camera = await mapRef.current.getCamera();
            setCameraDirection(camera.heading);
        }
    };
    
    // When camera is done moving
    const handleRegionChangeComplete = async (region) => {
        setTimeout(() => {
            if (isCameraMoving) {
                setIsCameraMoving(false);
            }
        }, 500);

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

    // Move camera to where user is
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
            partySocket.emit('location', {
                username: currentUser,
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

    // Update friend location's
    useEffect(() => {
        if (userSentLocation) {
            const objectSentLocation = JSON.parse(userSentLocation);

            // If sent location is yourself
            if (objectSentLocation.username != currentUser) {

                // If list has entries
                if (partyMemberLocation.length > 0) {
                    for (let i = 0; i < partyMemberLocation.length; i++) {
                        const currentMember = partyMemberLocation[i];
        
                        // If user location already there
                        if (objectSentLocation.username == currentMember.username) {
                            setPartyMemberLocation(prevState => {
                                let newState = [...prevState];
                                newState[i] = objectSentLocation;
                                return newState;
                            });
                        // Add to locations
                        } else {
                            setPartyMemberLocation(prevState => [...prevState, objectSentLocation]);
                        }
                    }
                } else {
                    setPartyMemberLocation(prevState => [...prevState, objectSentLocation]);
                }
            }

            setUserSentLocation(false);
        }

    }, [userSentLocation]);

    // Display loading screen while waiting for location
    // if (!userLocation || !places[0]) {
    if (!userLocation) {
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
                    onRegionChange={handleRegionChange}
                    onRegionChangeComplete={handleRegionChangeComplete}
                >
                    {/* {
                    places.map((place, index) => (
                        <Marker
                            key={index}
                            coordinate={{
                                latitude: place.coordinates.lat,
                                longitude: place.coordinates.long,
                            }}
                            title={place.address}
                        />
                    ))} */}
                    {partyMemberLocation.map((member, index) => (
                        <Marker
                            key={index}
                            coordinate={{
                                latitude: member.lat,
                                longitude: member.long
                            }}
                            title={member.username}  // Show username as marker title
                        >
                            <View style={styles.partyMemberLocation} >
                                <Image style={{ width: '100%', height: '100%', borderRadius: 15 }} source={data.images.defaultAvatar}/>
                            </View>
                        </Marker>
                    ))}

                </MapView>
                <Animated.View style={{ opacity }}>
                    <Button
                        icon="location-arrow"
                        boxStyle={{ top: 130, right: 16 }}
                        iconColor={data.colors.primaryColor}
                        functionCall={locationPressed}
                    />
                </Animated.View>
                {cameraDirection < 355 && cameraDirection > 5 && (
                    <Animated.View style={{ opacity }}>
                        <Button
                            icon="compass"
                            boxStyle={{ top: 190, right: 16 }}
                            iconColor={data.colors.primaryColor}
                            functionCall={resetToNorth}
                        />
                    </Animated.View>
                )}
            </View>
        </Pressable>
    )
};

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    partyMemberLocation: {
        width: 30,
        height: 30,
        borderWidth: 1,
        borderColor: data.colors.primaryColor,
        borderRadius: 15,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    }
});

export default Map