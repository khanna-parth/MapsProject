import { StyleSheet, View, Animated } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';

import data from '../utils/defaults/assets.js';

import PartyScreen from './PartyScreen';
import Map from '../components/Map';
import Searchbar from '../components/Searchbar';
import ProfileDropdown from '../components/ui/ProfileDropdown';

const HomeScreen = () => {
    const { isCameraMoving } = useGlobalState();
    const bottomSheetRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const opacity = useRef(new Animated.Value(isCameraMoving ? 0 : 1)).current;
    
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isCameraMoving ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isCameraMoving]);

    return (
        <View style={styles.container}>
            <Animated.View style={[{ opacity }, styles.searchbar]}>
                <Searchbar />
            </Animated.View>
            <Map />
            <Animated.View style={{ opacity }}>
                <ProfileDropdown />
            </Animated.View>
            <View style={styles.bottomOverlay} />
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={[155, 215, '50%', '85%']}
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
                onChange={(index) => {
                    setCurrentIndex(index);
                }}
            >
                <BottomSheetView style={styles.swipeUpContentContainer}>
                    <PartyScreen style={{ flex: 1 }} viewIndex={currentIndex}/>
                </BottomSheetView>
            </BottomSheet>
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
