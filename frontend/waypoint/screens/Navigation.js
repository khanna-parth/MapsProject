import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import Icon from 'react-native-vector-icons/FontAwesome';
import { getRoute } from '../utils/mapUtils.js';

import data from '../utils/defaults/assets.js'
import MapView, { PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const NavScreen = () => {
    const navigation = useNavigation();

    const mapRef = useRef(null);
    const [isZoomedIn, setIsZoomedIn] = useState(true);

    const [location, setLocation] = useState(null);

    const [route, setRoute] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const [showNewButtons, setShowNewButtons] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [eta, setEta] = useState("");
    const [remainingTime, setRemainingTime] = useState("");

    const snapPoints = useMemo(() => ['25%', '50%', '90%'], [])
    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleSheetChanges = useCallback((index) => {
        console.log('handleSheetChanges', index);
    }, []);

    //End Route
    const endRoute = () => {
        console.log("End Route -> Homepage")
        setShowNewButtons(false);
        setRoute(null);
        navigation.navigate("Home");
    }

    
    //Fetch User Route
    useEffect(() => {
        const fetchRoute = async () => {
            if (!location) return;
    
            setLoadingRoute(true);
            const routeData = await getRoute(location.latitude, location.longitude);
            
            //console.log(JSON.stringify(routeData, null, 2))
    
            if (!routeData.error && routeData.data.directions) {
                const routeCoordinates = routeData.data.directions.flatMap((step) => {
                    return decodePolyline(step.polyline);
                });
    
                setRoute(routeCoordinates);
    
                if (routeData.data.duration) {
                    const durationInSeconds = routeData.data.duration.value;
                    const durationInMinutes = Math.round(durationInSeconds / 60);
    
                    // Convert seconds to hours & minutes
                    const hours = Math.floor(durationInMinutes / 60);
                    const minutes = durationInMinutes % 60;
                    setRemainingTime(`${hours} Hours ${minutes} Minutes`);
    
                    // Get ETA
                    let arrivalTime = new Date();
                    arrivalTime.setSeconds(arrivalTime.getSeconds() + durationInSeconds);
                    setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                }
            } else {
                console.error("Failed to fetch route:", routeData.message);
            }
            setLoadingRoute(false);
        };
    
        fetchRoute();
    }, [location]);


    //Location
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
                    timeInterval: 1000000000000000000000,
                    distanceInterval: 10000000000000000000000000,
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
                }
            );
        };

        requestLocationPermission();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    //Zoom to user or zoom out to route
    const toggleZoom = () => {
        if (isZoomedIn) {
            if (route && route.length > 0 && mapRef.current) {
                const routeCoordinates = route.map(coord => ({
                    latitude: coord.latitude,
                    longitude: coord.longitude
                }));
    
                mapRef.current.fitToCoordinates(routeCoordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
                    animated: true,
                });
            }
        } else {
            if (location && mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                }, 1000);
            }
        }
        
        setIsZoomedIn(prev => !prev)
    };

    //Uses the polyline objects given by parths api 🪄🪄
    const decodePolyline = (encoded) => {
        let points = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
            let byte;
            let shift = 0;
            let result = 0;

            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            let deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += deltaLat;

            shift = 0;
            result = 0;

            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            let deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += deltaLng;

            points.push({
                latitude: lat / 1E5,
                longitude: lng / 1E5,
            });
        }

        return points;
    };

    if (!location || loadingRoute) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" animating={true}/>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <MapView 
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsPointsOfInterest={false}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                }}
            >
                {route && (
                    <Polyline
                        coordinates={route}
                        strokeWidth={7}
                        strokeColor="blue"
                    />
                )}
            </MapView>

            <TouchableOpacity style={styles.zoomButton} onPress={toggleZoom}>
                <Icon name={isZoomedIn ? "arrows-alt" : "location-arrow"} size={30} color="white" />
            </TouchableOpacity>

            <GestureHandlerRootView style={styles.swipeUpContainer}>
                <BottomSheet
                    useRef={bottomSheetRef}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    index={0}
                    enablePanDownToClose={false}
                >
                    <BottomSheetView style={styles.swipeUpContentContainer}>
                        <Text style={styles.topLeftText}>ETA: {eta || "--:-- --"}</Text>
                        <Text style={styles.topRightText}>{remainingTime || "-- Hours -- Minutes"}</Text>
                        
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
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
    zoomButton: {
        position: 'absolute',
        bottom: 150,
        right: 20,
        width: 60,
        height: 60,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        elevation: 5, //Smelly Android
        shadowColor: '#000', //Pog IOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    }
})

export default NavScreen;
