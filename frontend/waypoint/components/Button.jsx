import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import React from 'react'

import data from '../utils/defaults/assets.js'

const Button = ({ icon, iconColor, style, functionCall }) => {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={functionCall}>
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
        backgroundColor: data.colors.primaryColor,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
})

export default Button