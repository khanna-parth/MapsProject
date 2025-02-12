import { Text, StyleSheet, View, Image, Dimensions, TouchableOpacity, Keyboard } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'

import { useNavigation } from '@react-navigation/native';

import data from '../utils/defaults/assets.js';
import { useGlobalState } from './GlobalStateContext';

const { width, height } = Dimensions.get('window');

const Searchbar = ({style}) => {
    const navigation = useNavigation();

    const { userLocation, setUserLocation } = useGlobalState();

    const searchbarTouched = () => {
        Keyboard.dismiss();
        navigation.navigate(
            'MapSearch', 
            {userLocation},
        );
    }

    return (
        <View 
            style={[styles.container, style]}
            onTouchStart={searchbarTouched}
        >   
            <View style={styles.textInput}>
                <Text style={styles.placeHolderText}>Search</Text>
            </View>
            <TouchableOpacity>
                <Image source={data.images.searchIconBlack} style={styles.searchImage}/>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: '90%',
        height: 50,
        backgroundColor: data.colors.offWhite,
        //borderColor: data.colors.primaryColor,
        //borderWidth: 1,
        borderRadius: 25,
        shadowColor: 'black',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    searchImage: {
        width: 20,
        height: 20
    },
    textInput: {
        height: '100%',
        width: (width - (width*.15)) - 30,
        justifyContent: 'center',
        //backgroundColor: 'white',
        
    },
    placeHolderText: {
        color: '#999',
        fontSize: 18,
    }
});

export default Searchbar;
