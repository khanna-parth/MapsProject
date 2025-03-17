import { useNavigation } from '@react-navigation/native';
import { useGlobalState } from '../components/global/GlobalStateContext.jsx';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from './UserSearch.jsx';
import tw from 'twrnc';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { sleep, uploadImage } from '../utils/utils.js';

const Profile = () => {
  const navigation = useNavigation();
  const { currentUser, setCurrentUser } = useGlobalState();
  const [imageData, setImageData] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  useEffect(() => {
    // console.log(imageData)
    if (imageData && imageData.length != 0) {
      const upload = async () => {
        const success = await uploadImage("user/edit/avatar", imageData, {username: currentUser});
        if (success) {
          // console.log('upload succeeded')
          setAvatarChanged(true);
          
        }
      }

      upload();
    }
  }, [imageData, currentUser])

  const handleImagePicker = async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
          alert('Permission to access the media library is required!');
          return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        // base64: true
      });

      if (!result.canceled) {
        console.log(result);
        if (result.assets[0].uri) {
          setImageData(result.assets[0]);
          console.log(`Set image data to picture`)
        }
      }
  };
  return (
    <SafeAreaView>
      <View style={tw`flex w-full items-center justify-center my-5`}>
        <View>
          <Pressable onPress={handleImagePicker}>
            <UserAvatar style={tw`w-[150px] h-[150px] rounded-full`} username={currentUser} reload={avatarChanged} reloadComplete={() => setAvatarChanged(false)}></UserAvatar>
          </Pressable>
        </View>
        <Text style={tw`flex text-3xl font-bold mt-5`}>{currentUser.length > 0 ? currentUser : `Firstname Lastname`}</Text>
        <Text>Will add profile stuff later as well as password reset and change image. Should be pretty simple</Text>
      </View>
    </SafeAreaView>
  )
}

export default Profile;