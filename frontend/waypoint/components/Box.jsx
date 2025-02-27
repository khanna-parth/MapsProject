import { Text, StyleSheet, TouchableOpacity, Image } from 'react-native'

import data from '../utils/defaults/assets';

function Box({ children, style, onPress, textStyle, source=null }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.box, style]} >
            {source && <Image source={source} style={styles.cardImage} />}  
            <Text style={[styles.text, textStyle]}>{children}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    box: {
        backgroundColor: data.colors.primaryColor,
        width: 120,
        height: 80,
        justifyContent: 'center', // Center content vertically
        alignItems: 'center', // Center content horizontally
        borderRadius: 20,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center", // Horizontal text alignment
        textAlignVertical: 'center', // Vertical text alignment (Android only)
        color: data.colors.offWhite,
    },
    cardImage: {
        width: 32,
        height: 32,
        alignItems: 'center',
        marginBottom: 5,
    },
});

export default Box