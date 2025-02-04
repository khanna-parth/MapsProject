import { StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { getNearbyPlaces, getDistance } from '../utils/mapUtils.js';

const Map = () => {
    const [location, setLocation] = useState(null);
    const [places, setPlaces] = useState([null]);
    const [previousLocation, setPreviousLocation] = useState(location);
    const [timeoutId, setTimeoutId] = useState(null);

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
            setLocation(currentLocation.coords);
            setPreviousLocation(currentLocation.coords);

            // Location updates
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000, // 1 sec
                    distanceInterval: 1, // Moved 1m
                },
                (newLocation) => {
                    //setLocation(newLocation.coords);
                    //setPreviousLocation(newLocation.coords);
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
    const fetchPlaces = useCallback(async(latitude, longitude) => {
        //const placeData = await getNearbyPlaces(latitude, longitude); // Uncomment when done

        const placeData = {error: false, data: [{address: "Pizza My Heart", coordinates: {lat: 36.972285, long: -122.02541699999999}, details: {formattedAddress: "1116 Pacific Ave, Santa Cruz, CA 95060, USA", primaryType: "pizza_restaurant", types: ["pizza_restaurant", "italian_restaurant", "meal_takeaway", "restaurant", "food", "point_of_interest", "establishment"]}}]}

        if (!placeData.error) {
            setPlaces(placeData.data);
        }
    }, []);
    
    // When camera moves
    const handleRegionChangeComplete = useCallback((region) => {
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
    }, []);

    // Get first stuff on map
    useEffect(() => {
        if (location) {
            fetchPlaces(location.latitude, location.longitude);
        }
    }, [location]);

    // Display loading screen while waiting for location
    if (!location || !places[0]) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" animating={true}/>
            </SafeAreaView>
        )
    }

    return (
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
            onRegionChange={() => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    setTimeoutId(null);
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
    )
};

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default Map