import { StyleSheet, Text, View, Platform, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import data from '../utils/defaults/defaultColors.js'
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

async function requestLocationPermission() {
    let { status } = await Location.requestPermissionsAsync();
    if (status !== 'granted') {
        alert('Permission to access location was denied');
    }
}

const HomeScreen = () => {
    const [location, setLocation] = useState(null);

    const snapPoints = useMemo(() => ['15%', '60%', '90%'], [])

    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleSheetChanges = useCallback((index) => {
        console.log('handleSheetChanges', index);
    }, []);

    useEffect(() => {
        requestLocationPermission();
    
        const locationSubscription = Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 1,
            }, (newLocation) => {
                setLocation(newLocation);
            }
        );
    
    }, []);

    if (!location) {
        return (
            <ActivityIndicator size="large" animating={true}/>
        )
    }

    return (
        <View style={styles.container}>
            <MapView 
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                showsMyLocationButton={true}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            />
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