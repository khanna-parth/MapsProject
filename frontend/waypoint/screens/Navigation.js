import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';

import data from '../utils/defaults/assets.js';

import Icon from 'react-native-vector-icons/FontAwesome';
import { getRoute, getDistance } from '../utils/mapUtils.js';

import * as Location from 'expo-location';
import Map from '../components/Map';
import PartyScreen from './PartyScreen';

const NavScreen = () => {
    const navigation = useNavigation();

    const { setExitNavigation } = useGlobalState();

    const screenRoute = useRoute();
    const { coordinates } = screenRoute.params || {};

    const mapRef = useRef(null);

    const [location, setLocation] = useState(null);

    const [route, setRoute] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const [showNewButtons, setShowNewButtons] = useState(false);

    const [directions, setDirections] = useState([]);
    const [nextDirection, setNextDirection] = useState(null);

    const [eta, setEta] = useState("");
    const [remainingTime, setRemainingTime] = useState("");

    const snapPoints = useMemo(() => ['20%', '20%'], [])
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [routeRequested, setRouteRequested] = useState(false);

    const handleSheetChanges = useCallback((index) => {
        console.log('handleSheetChanges', index);
    }, []);

    const partySheetRef = useRef(null);

    const togglePartyScreen = () => {
        if (partySheetRef.current) {
            partySheetRef.current.expand();
        }
    };

    const closePartyScreen = () => {
        if (partySheetRef.current) {
            partySheetRef.current.close();
        }
    };

    //End Route
    const endRoute = () => {
        console.log("End Route -> Homepage")
        setShowNewButtons(false);
        setRoute(null);
        setExitNavigation(true);
        navigation.navigate("Home");
    }

    //Add Waypoint
    const waypoint = () => {
        console.log("Waypoint +");
        navigation.navigate("MapSearch");
    }
    
    //Fetch User Route
    const fetchRoute = useCallback(async (forceReroute = false) => {
        if (!location || (!forceReroute && routeRequested)) return;
    
        setRouteRequested(true);
        setLoadingRoute(true);

        console.log("Destination:", coordinates);
        console.log(forceReroute ? "Re-Routing..." : "Loading route...");

        const routeData = await getRoute(location.latitude, location.longitude, coordinates.lat, coordinates.long);
    
        if (!routeData.error && routeData.data.directions) {
            setDirections(routeData.data.directions);
            setNextDirection(routeData.data.directions[0]);
    
            const routeCoordinates = routeData.data.directions.flatMap((step) => {
                return decodePolyline(step.polyline);
            });
    
            setRoute(routeCoordinates);
    
            if (routeData.data.duration) {
                const durationInSeconds = routeData.data.duration.value;
                const durationInMinutes = Math.round(durationInSeconds / 60);
    
                const hours = Math.floor(durationInMinutes / 60);
                const minutes = durationInMinutes % 60;
                setRemainingTime(`${hours} Hours ${minutes} Minutes`);
    
                let arrivalTime = new Date();
                arrivalTime.setSeconds(arrivalTime.getSeconds() + durationInSeconds);
                setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } else {
            console.error("Failed to fetch route:", routeData.message);
        }
    
        setLoadingRoute(false);
        setRouteRequested(false);
    }, [location, routeRequested]);
    
    // Initial fetch
    useEffect(() => {
        fetchRoute();
    }, [location]);
    
    // Off Route, Reroute
    useEffect(() => {
        if (!location || !route || route.length === 0) return;
    
        const checkIfOffRoute = () => {
            let closestDistance = Infinity;
    
            for (let i = 0; i < route.length; i++) {
                const point = route[i];
                const distance = getDistance(location.latitude, location.longitude, point.latitude, point.longitude);
                if (distance < closestDistance) {
                    closestDistance = distance;
                }
            }
    
            // Meters off route - needs fine tuning
            if (closestDistance > 10000) {
                console.log("Recalculating...");
                setTimeout(() => fetchRoute(true), 3000);
            }
        };
    
        checkIfOffRoute();
    }, [location, route, fetchRoute]);

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
                    timeInterval: 5000, // Update every 5s
                    distanceInterval: 10, // Update every 10 meters
                },
                (newLocation) => {
                    setLocation(newLocation.coords);
    
                    if (mapRef.current) {
                        mapRef.current.animateToRegion({
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude,
                            latitudeDelta: 0.004,
                            longitudeDelta: 0.004,
                        }, 1000);
                    }
                }
            );
            console.log("User Location Checked");
        };
    
        requestLocationPermission();
    
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    //Directions
    useEffect(() => {
        if (!location || directions.length === 0) return;
        
        for (let i = 0; i < directions.length; i++) {
            const step = directions[i];
            const distanceToStep = getDistance(
                location.latitude, location.longitude, 
                step.origin.lat, step.origin.long
            );
    
            //5 meters thresh
            if (distanceToStep < 5) {
                setNextDirection(directions[i + 1] || null);
                console.log("Next Direction:", directions[i + 1]);
                break;
            }
        }
    }, [location, directions]); 

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

    // if (!location || loadingRoute) {
    if (!location) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" animating={true}/>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {nextDirection && (
                <View style={styles.directionBar}>
                    <Text style={styles.directionText}>{nextDirection.description}</Text>
                </View>
            )}
            
            <Map route={route}/>

            <BottomSheet
                useRef={bottomSheetRef}
                snapPoints={['20%', '20%']}
                backgroundStyle={{ 
                    backgroundColor: data.colors.offWhite, 
                    shadowColor: 'black',
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 10, 
                }}
                index={0}
                enablePanDownToClose={false}
                enableDynamicSizing={false}
                onChange={handleSheetChanges}
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
                                <TouchableOpacity style={styles.button} onPress={waypoint}>
                                    <Icon name="map-marker" size={35} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={togglePartyScreen}>
                                    <Icon name="users" size={30} color="white" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </BottomSheetView>

            </BottomSheet>
            
            {/* PartyScreen Bottom Sheet */}
            <BottomSheet
                ref={partySheetRef}
                backgroundStyle={{ 
                    backgroundColor: data.colors.offWhite, 
                    shadowColor: 'black',
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 10, 
                }}
                snapPoints={['60%']}
                index={-1} // Initially closed
                enablePanDownToClose={true}
                enableDynamicSizing={false}
            >
                <BottomSheetView style={styles.partySheetContainer}>
                    <PartyScreen />
                    <TouchableOpacity onPress={closePartyScreen} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
};

//Style Sheet
const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    directionBar: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        zIndex: 1000,
        elevation: 5,
    },
    directionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    partySheetContainer: {
        flex: 1,
        padding: 15,
        alignItems: 'stretch',
        justifyContent: 'flex-start',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#ff6347',
        padding: 10,
        borderRadius: 20,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
})

export default NavScreen;
