import { StyleSheet, View, Text, Image, TextInput, FlatList, Modal } from 'react-native';
import { useState } from 'react';

const defaultImage = require("../assets/default-avatar-icon.jpg")

import data from '../utils/defaults/defaultColors.js'
import { storeData, getData, removeData, postRequest } from '../utils/utils.js';

function SearchScreen({ visible, onRequestClose }) {
    const [username, setUsername] = useState("");

    const [searchList, setSearchList] = useState([]);

    return (
        <Modal visible={ visible } 
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={ onRequestClose }>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Search User</Text>
                <TextInput 
                    style={styles.textInput} 
                    placeholder='Search'
                    value={username}
                    onChangeText={setUsername}
                />
                    <Text style={styles.listHeaderText}>Results</Text>
                    <FlatList 
                    data={[{ "userID": "7", "username": "Parth Khanna" }, { "userID": "8", "username": "Howard" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.userID}>
                                <Image source={defaultImage} style={styles.cardImage}/>
                                <View style={styles.cardTextArea} key={item.userID}>
                                    <Text style={styles.cardText}>{item.username}</Text>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.userID.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                />
                {/* <Button title='Close' color={data.primaryColor} onPress={() => {
                    setSearchModalVisible(false); 
                    setUsername("");
                }} />                 */}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: data.offWhite,
        padding: 16,
        paddingBottom: 0,
    },
    modalTitle: {
        textAlign: 'center',
        paddingBottom: 16,
        fontSize: 20,
        fontWeight: 'bold'
    },
    textInput: {
        height: 40,
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 10,
        borderRadius: 5
    },
    listHeaderText: {
        fontSize: 20,
        marginBottom: 12,
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
    cardImage: {
        width: 50,
        height: 50,
        backgroundColor: 'white',
        marginRight: 10,
        borderRadius: 100,
    },
    cardText: {
        fontSize: 20
    },
});

export default SearchScreen;