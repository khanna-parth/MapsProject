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
        justifyContent: 'flex-end',
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        color: data.colors.offWhite,
        textAlignVertical: 'bottom',
        paddingBottom: 10,
    },
    cardImage: {
        width: 32,
        height: 32,
        alignItems: 'center',
        marginBottom: 5,
    },
});

export default Box