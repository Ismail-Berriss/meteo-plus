import { View, Text, Button } from 'react-native';
import React, { useEffect } from 'react';
import * as FileSystem from 'expo-file-system';  // Required for accessing local file system
import axios from 'axios';
import { Asset } from 'expo-asset'; // Import Asset module
import {DB} from '@/utils/database';

const Transcribe = () => {
  const FLASK_SERVER_URL = "https://1b00-196-119-60-6.ngrok-free.app/transcribe";

  // Async function to upload audio file
  const uploadAudioFile = async () => {
    try {
      // Load the audio file as an asset
      const asset = Asset.fromModule(require('@/assets/audio.wav'));
      await asset.downloadAsync();  // Ensure the asset is downloaded

      if (!asset.localUri) {
        throw new Error('Failed to load audio file');
      }

      // Read the file content (optional if you want to use the base64 string)
      // const base64Audio = await FileSystem.readAsStringAsync(asset.localUri, {
      //   encoding: FileSystem.EncodingType.Base64
      // });

      // Create FormData and append the audio file
      const formData = new FormData();
      formData.append('file', {
        uri: asset.localUri,
        type: 'audio/wav',
        name: 'audio.wav',
      });

      // Send the audio file to the server
      const serverResponse = await axios.post(FLASK_SERVER_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Set the correct content type
        },
      });

      console.log('Server response:', serverResponse.data);
      // Handle the server response, like displaying transcription or success message

    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  };
  useEffect(()  => {
    const dbb= async()=>{
      const db = await SQLite.openDatabaseAsync('db');

    }
    dbb();
  }, []);

  return (
    <View>
      <Text>Transcribe Audio</Text>
      <Button onPress={uploadAudioFile} title="Upload Audio File" />
    </View>
  );
};

export default Transcribe;
