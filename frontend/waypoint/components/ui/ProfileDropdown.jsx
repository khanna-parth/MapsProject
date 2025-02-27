import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Animated, Image, Platform, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import data from '../../utils/defaults/assets.js';
import Icon from 'react-native-vector-icons/FontAwesome';

// Avatar component
const Avatar = ({ source, size = 50, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.avatar, { width: size, height: size }]}>
      {source ? (
        <Image source={source} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarFallback, { width: size, height: size }]}>
          <Icon name="user" size={26} color={data.colors.primaryColor} />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Dropdown Menu component
const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  // Close dropdown when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (isOpen) {
          toggleDropdown();
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (isOpen) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsOpen(false);
      });
    } else {
      setIsOpen(true);
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleNavigation = (screen) => {
    toggleDropdown();
    // Navigate to the appropriate screen
    if (screen === 'profile') {
      navigation.navigate('Profile');
    } else if (screen === 'settings') {
      // Add navigation to settings screen when available
      console.log('Navigate to settings');
    } else if (screen === 'logout') {
      // Handle logout logic
      console.log('Logout');
    }
  };

  return (
    <View style={styles.container}>
      <Avatar 
        size={50} 
        onPress={toggleDropdown} 
      />
      
      {isOpen && (
        <Modal
          transparent={true}
          visible={isOpen}
          animationType="none"
          onRequestClose={toggleDropdown}
        >
          <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
            <Animated.View 
              style={[
                styles.dropdown, 
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.dropdownContent}>
                <Text style={styles.dropdownLabel}>My Account</Text>
                <View style={styles.separator} />
                
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleNavigation('profile')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleNavigation('settings')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Settings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleNavigation('team')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Party</Text>
                </TouchableOpacity>
                
                <View style={styles.separator} />
                
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleNavigation('logout')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, styles.logoutText]}>Log out</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 130,
    left: 16,
    // zIndex: 1,
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 2,
    elevation: 10,
  },
  avatar: {
    borderRadius: 20,
    backgroundColor: data.colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    width: 50,
    height: 50,
    shadowOpacity: 0.2,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 2,
    elevation: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: data.colors.offwhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    width: 50,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: {
    position: 'absolute',
    top: 130,
    left: 16,
    backgroundColor: data.colors.offWhite,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    width: 200,
    zIndex: 10000,
  },
  dropdownContent: {
    padding: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  dropdownItem: {
    padding: 8,
    borderRadius: 4,
    marginVertical: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  logoutText: {
    color: data.colors.red,
  },
  shortcutText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileDropdown; 