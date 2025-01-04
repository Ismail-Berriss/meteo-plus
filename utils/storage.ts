// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CITIES_STORAGE_KEY = 'cities';

export const StorageUtils = {
  saveCities: async (cities) => {
    try {
      const jsonValue = JSON.stringify(cities);
      await AsyncStorage.setItem(CITIES_STORAGE_KEY, jsonValue);
      console.log('Cities saved successfully:', cities);
      return true;
    } catch (error) {
      console.error('Error saving cities:', error);
      return false;
    }
  },

   loadCities : async () => {
    try {
      const cities = [];
      
      // Loop through keys from 1 to 10 and fetch corresponding city data
      for (let i = 1; i <= 10; i++) {
        const cityKey = `city_${i}`; // Construct the key for city
        const cityData = await AsyncStorage.getItem(cityKey);
        
        if (cityData) {
          cities.push(JSON.parse(cityData)); // Parse and add to cities array
        }
      }
      
      console.log('Loaded cities:', cities);
      return cities;
    } catch (error) {
      console.error('Error loading cities:', error);
      return [];
    }
  },
  

  clearAll: async () => {
    try {
      await AsyncStorage.clear();
      console.log('Storage cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};