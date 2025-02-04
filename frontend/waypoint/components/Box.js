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
        width: 100,
        height: 100,
        justifyContent: 'flex-end',
        borderRadius: 8,
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "white",
        textAlignVertical: 'bottom',
        paddingBottom: 5,
    },
    cardImage: {
        width: 50,
        height: 50,
        alignItems: 'center',
        marginBottom: 5,
    },
});

export default Box