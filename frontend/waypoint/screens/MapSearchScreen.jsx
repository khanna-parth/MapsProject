import { ActivityIndicator, Text, FlatList, TouchableWithoutFeedback, StyleSheet, View, TextInput, Image, Dimensions, TouchableOpacity, Keyboard, Platform } from 'react-native'
import React, { useState } from 'react'

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useGlobalState } from '../components/GlobalStateContext';
import data from '../utils/defaults/assets.js';
import { postRequest } from '../utils/utils.js';

const { width, height } = Dimensions.get('window');

const Searchbar = ({ route }) => {
    const navigation = useNavigation();

    const { userLocation } = useGlobalState();
    const [searchString, setSearchString] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [placeList, setPlaceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // User pressed enter, or waited on search. Searches for places.
    const handleReturnPress = async () => {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        setIsLoading(true);

        const searchData = await postRequest('routing/search', {query: searchString, lat: userLocation.latitude, long: userLocation.longitude});

        if (!searchData.error) {
            
            let returnData = [];

            // Check once latitude and longitude are added
            for (let i = 0; (i < searchData.data.places.data.places.length && i < 5); i++) {
                let temp = searchData.data.places.data.places[i];
                temp['cardID'] = i;
                returnData.push(temp)
            }
            
            setPlaceList(returnData)
        } else {
            setPlaceList([]);
        }

        setIsLoading(false);
        setTypingTimeout(null);
    }

    // Use touches x icon
    const exitIconPressed = () => {
        setSearchString("");
        Keyboard.dismiss();
        navigation.goBack();
    }

    // User is typing or made a change to search text
    const searchInputChange = (text) => {
        setSearchString(text);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
            setTypingTimeout(null);
        }

        setIsLoading(true);

        // Create a timeout to make sure user done typing
        if (searchString.length >= 3) {
            const timeout = setTimeout(() => {
                handleReturnPress();
            }, 2000);
    
            setTypingTimeout(timeout);
        } else {
            setPlaceList([]);
            setIsLoading(false);
        }
    }

    // User clicked on destination
    const destinationPressed = (coordinates) => {
        console.log(coordinates)
        // Send to navigation
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View 
                style={styles.searchContainer}
            >
                <TextInput 
                    style={styles.textInput} 
                    placeholder='Search'
                    value={searchString}
                    onChangeText={searchInputChange}
                    onSubmitEditing={handleReturnPress}
                    autoFocus={true}
                />
                <TouchableOpacity onPress={exitIconPressed}>
                    <Image source={data.images.closeIcon} style={styles.searchImage}/>
                </TouchableOpacity>
            </View>
            <TouchableWithoutFeedback style={styles.notSearch} onPressIn={() => Keyboard.dismiss()}>
                <View style={[styles.notSearch, styles.wrapper]}>
                <FlatList 
                    data={placeList}
                    renderItem={({ item }) => {
                        return (
                            <TouchableOpacity onPress={() => destinationPressed(item.coordinates)}>
                                <View style={styles.card} key={item.cardID}>
                                    <View style={styles.cardTextArea} key={item.cardID}>
                                        <Text style={styles.cardText}>{item.name}</Text>
                                        <Text style={styles.cardSubtext}>{item.address}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.cardID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                    ListEmptyComponent={
                        isLoading ? (
                            <View style={{ flex: 1, paddingTop: 20, zIndex: 1000, width: '100%', height: '100%' }}>
                                <ActivityIndicator size="large" animating={true}/>
                            </View>
                        ) : (
                            <View style={styles.listEmptyContainer}>
                                <Text style={styles.listHeaderText}>No Places Found</Text>
                            </View>
                        )
                    }
                    ListHeaderComponent={
                        placeList.length > 0 ? ( // Only show header when there's data
                            <View style={{flex:1}}>
                                <Text style={styles.listHeaderText}>Places</Text>
                            </View> 
                        ) : null  
                    }
                />
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: data.colors.offWhite,
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: '90%',
        height: 50,
        backgroundColor: 'white',
        borderRadius: 25,
    },
    searchImage: {
        width: 20,
        height: 20
    },
    textInput: {
        height: '100%',
        width: (width - (width*.15)) - 30,
        //backgroundColor: 'white',
        fontSize: 18,
    },
    notSearch: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextArea: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        //marginBottom: 16
    },
    cardText: {
        fontSize: 20,
        paddingBottom: 2,
    },
    cardSubtext: {
        color: '#999',
        fontSize: 12
    },
    listHeaderContainer: {
        flex: 1,
        justifyContent: "space-between",
        flexDirection: 'row',
        paddingBottom: 16
    },
    listEmptyContainer: {
        flex: 1,
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        rowGap: 20,
    },
    listHeaderText: {
        fontSize: 20,
        marginVertical: 12,
    },
    cardPlusImage: {
        width: 25,
        height: 25,
        alignSelf: 'flex-end'
    },
});

export default Searchbar;
