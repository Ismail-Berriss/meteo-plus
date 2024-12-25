import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ACCUWEATHER_API_KEY } from "@/api";
const AddCityScreen = () => {
  const [key,setKey]=useState('');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigation = useRouter();

  

  const getAutocompleteSuggestions = async () => {
    if (query.length < 3) return;
    try {
      const response = await fetch(
        `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${ACCUWEATHER_API_KEY}&q=${query}`
      );
      const data = await response.json();
      setSuggestions(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
    }
  };
  const handleSelectCity = async (city) => {
    try {
      console.log("the city:",city);
      await AsyncStorage.setItem('city-key', city.Key);
      console.log("the key stored:",city.Key);
      await AsyncStorage.setItem('city-name', city.LocalizedName);
      await AsyncStorage.setItem('country-name', city.Country.LocalizedName);

      navigation.navigate('/home');
    } catch (error) {
      console.error('Error saving city key:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={['#6d28d9', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Choose Your Main City
          </Text>
          <TextInput
            style={{
              backgroundColor: '#f3f4f6',
              height: 40,
              paddingHorizontal: 10,
              borderRadius: 5,
              marginBottom: 10,
            }}
            placeholder="Enter city name"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              getAutocompleteSuggestions();
            }}
          />
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.Key}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f3f4f6',
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 5,
                    marginBottom: 5,
                  }}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text>{item.LocalizedName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={{
              backgroundColor: '#6d28d9',
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 5,
              marginTop: 10,
            }}
            onPress={() => navigation.push('/login')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

export default AddCityScreen;