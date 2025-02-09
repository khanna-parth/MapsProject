import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useMemo, useState, useRef } from 'react';

import data from '../utils/defaults/assets.js'

import PartyScreen from './PartyScreen';
import Map from '../components/Map';
import Searchbar from '../components/Searchbar';

const HomeScreen = () => {
    const snapPoints = useMemo(() => ['15%', '20%', '50%', '85%'], [])

    const bottomSheetRef = useRef<BottomSheet>(null);

    const [location, setLocation] = useState(null);

    const handleSheetChanges = (index) => {
        //console.log('handleSheetChanges', index);
    };

    return (
        <View style={styles.container}>
            <Searchbar style={styles.searchbar} location={location}/>
            <Map location={location} setLocation={setLocation}/>
            <GestureHandlerRootView style={styles.swipeUpContainer}>
                <BottomSheet
                    useRef={bottomSheetRef}
                    snapPoints={snapPoints}
                    backgroundStyle={{ backgroundColor: data.colors.offWhite }}
                    onChange={handleSheetChanges}
                    index={0}
                >
                    <BottomSheetView style={styles.swipeUpContentContainer}>
                        <PartyScreen style={{flex: 1}}/>
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
    searchbar: {
        position: 'absolute',
        top: 60,
        zIndex: 10,
    },
    swipeUpContainer: {
        flex: 1,
    },
    swipeUpContentContainer: {
        flex: 1,
    },
})

export default HomeScreen;