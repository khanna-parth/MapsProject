import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import React from 'react'

import data from '../utils/defaults/assets.js'

const Button = ({ icon, iconColor, boxStyle, functionCall }) => {
    return (
        <TouchableOpacity style={[styles.button, boxStyle]} onPress={functionCall}>
            <Icon name={icon} size={25} color={iconColor} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        //right: 10,
        //top: 120,
        width: 50,
        height: 50,
        backgroundColor: data.colors.offWhite,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 2,
        elevation: 10,
    },
})

export default Button