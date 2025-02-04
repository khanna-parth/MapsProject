import { StyleSheet, Text, View, Platform, SafeAreaView, Button } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import data from '../utils/defaults/defaultColors.js'

import PartyScreen from './PartyPage.js';
import Map from '../components/Map.js';

const HomeScreen = () => {
    const snapPoints = useMemo(() => ['18%', '60%', '90%'], [])

    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleSheetChanges = useCallback((index) => {
        console.log('handleSheetChanges', index);
    }, []);

    return (
        <View style={styles.container}>
            <Map/>
            <GestureHandlerRootView style={styles.swipeUpContainer}>
                <BottomSheet
                    useRef={bottomSheetRef}
                    snapPoints={snapPoints}
                    backgroundStyle={{ backgroundColor: data.offWhite }}
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
    swipeUpContainer: {
        flex: 1,
    },
    swipeUpContentContainer: {
        flex: 1,
    },
})

export default HomeScreen;