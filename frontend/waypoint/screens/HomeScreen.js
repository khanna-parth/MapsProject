import { StyleSheet, Text, View, Platform, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { getNearbyPlaces } from '../utils/mapUtils.js';

import data from '../utils/defaults/defaultColors.js'
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const HomeScreen = () => {
    const [location, setLocation] = useState(null);
    const [places, setPlaces] = useState([null]);

    const snapPoints = useMemo(() => ['15%', '60%', '90%'], [])

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
            setLocation(currentLocation.coords);

            // Location updates
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000, // 1 sec
                    distanceInterval: 1, // Moved 1m
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
            fetchPlaces(location.latitude, location.longitude);
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
                >
                    <BottomSheetView style={styles.swipeUpContentContainer}>
                        <Text>Poop 💩</Text>
                        <View style={{width: '100%', height: 500, backgroundColor: 'blue'}}></View>
                    </BottomSheetView>
                </BottomSheet>
            </GestureHandlerRootView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //paddingTop: Platform.OS === 'android' ? 25 : 0
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    swipeUpContainer: {
        flex: 1,
    },
    swipeUpContentContainer: {
        flex: 1,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
})

export default HomeScreen;