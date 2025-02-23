import { Text, StyleSheet, View, Dimensions, Keyboard } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/AntDesign'

import { useNavigation } from '@react-navigation/native';

import data from '../utils/defaults/assets.js';

const { width, height } = Dimensions.get('window');

const Searchbar = ({style}) => {
    const navigation = useNavigation();

    const searchbarTouched = () => {
        Keyboard.dismiss();
        navigation.navigate('MapSearch');
    }

    return (
        <View 
            style={[styles.container, style]}
            onTouchEnd={searchbarTouched}
        >   
            <View style={styles.textInput}>
                <Text style={styles.placeHolderText}>Search</Text>
            </View>
            <Icon name='search1' size={25} color='black' />
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
        width: width - 32,
        height: 50,
        backgroundColor: data.colors.offWhite,
        borderRadius: 20,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
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
    },
    placeHolderText: {
        color: '#999',
        fontSize: 18,
    }
});

export default Searchbar;
