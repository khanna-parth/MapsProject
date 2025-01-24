import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

function Box({ children, style, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.box, style]} >
            <Text style={styles.text}>{children}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    box: {
        backgroundColor: '#3E82FC',
        width: 100,
        height: 100,
        justifyContent: 'flex-end',
        borderRadius: 8,
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "white",
        textAlignVertical: 'bottom'
    }
});

export default Box