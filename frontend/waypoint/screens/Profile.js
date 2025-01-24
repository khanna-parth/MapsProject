import { StyleSheet, Text, View, Platform, SafeAreaView, FlatList } from 'react-native';
import Box from '../components/Box';

import { useNavigation } from '@react-navigation/native';

function TabTwoScreen() {
    const navigation = useNavigation();


    const handleLeave = () => {
        console.log('leave');
    };

    const handleSearch = () => {
        console.log('search');
        navigation.navigate('Search');
    };

    const handleInvite = () => {
        console.log('invite');
        navigation.navigate('Invite');
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.topButtons}>
                <Box style={{ backgroundColor: "#C65252"}} onPress={handleLeave}>Leave</Box>
                <Box onPress={handleSearch}>Search</Box>
                <Box onPress={handleInvite}>Invite</Box>
            </View>
            <View style={styles.scrollView}>
                <Text style={styles.headerText}>Party Members</Text>
                <FlatList 
                    data={[{ "id": "7", "type": "Water", "name": "Grant" }, { "id": "8", "type": "Water", "name": "Regis" }]}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card} key={item.id}>
                                <View style={styles.cardImage}></View>
                                <View style={styles.textArea} key={item.id}>
                                    <Text style={styles.cardText}>{item.name}</Text>
                                </View>
                            </View>
                        );
                    }}
                    horizontal={false}
                    keyExtractor={(item) => item.id.toString()}
                    ItemSeparatorComponent={<View style={{ height: 16 }} />}
                />
            </View>
            
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
        backgroundColor: '#F2F2F2',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textArea: {
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
    headerText: {
        fontSize: 20,
        marginBottom: 12,
    },
    topButtons: {
        justifyContent: "space-evenly",
        flexDirection: 'row',
        paddingBottom: 20
    }
});

export default TabTwoScreen;