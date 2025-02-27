import { StyleSheet, View, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useGlobalState } from '../components/GlobalStateContext';

import data from '../utils/defaults/assets.js';

import PartyScreen from './PartyScreen';
import Map from '../components/Map';
import Searchbar from '../components/Searchbar';
import ProfileDropdown from '../components/ui/ProfileDropdown';

const HomeScreen = () => {
    const { isCameraMoving } = useGlobalState();
    const bottomSheetRef = useRef(null);
    const bottomSheetSnapPoints = useMemo(() => [155, 215, '50%', '85%'], []);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const opacity = useRef(new Animated.Value(isCameraMoving ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isCameraMoving ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isCameraMoving]);

    // Ensuring layout is ready before showing the bottom sheet
    const handleLayout = () => {
        setIsLayoutReady(true);
    };

    // Ensuring the bottom sheet always snaps correctly after mount
    useEffect(() => {
        if (isLayoutReady && bottomSheetRef.current) {
            const timeout = setTimeout(() => {
                bottomSheetRef.current.snapToIndex(0);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isLayoutReady]);

    return (
        <View style={styles.container} onLayout={handleLayout}>
            <Animated.View style={[{ opacity }, styles.searchbar]}>
                <Searchbar />
            </Animated.View>
            <Map />
            <Animated.View style={{ opacity }}>
                <ProfileDropdown />
            </Animated.View>
            <GestureHandlerRootView style={styles.swipeUpContainer}>
                <View style={styles.bottomOverlay} />
                {isLayoutReady && (
                    <BottomSheet
                        ref={bottomSheetRef}
                        snapPoints={bottomSheetSnapPoints}
                        backgroundStyle={{ 
                            backgroundColor: data.colors.offWhite, 
                            shadowColor: 'black',
                            shadowOpacity: 0.2,
                            shadowRadius: 5,
                            elevation: 10, 
                        }}
                        index={0}
                        onChange={(index) => setCurrentIndex(index)}
                    >
                        <BottomSheetView style={styles.swipeUpContentContainer}>
                            <PartyScreen style={{ flex: 1 }} viewIndex={currentIndex}/>
                        </BottomSheetView>
                    </BottomSheet>
                )}
            </GestureHandlerRootView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchbar: {
        position: 'absolute',
        alignSelf: 'center',
        top: 60,
        zIndex: 10,
    },
    swipeUpContainer: {
        flex: 1,
    },
    swipeUpContentContainer: {
        flex: 1,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 25,
        backgroundColor: data.colors.offWhite,
        zIndex: 10,
    },
});

export default HomeScreen;
