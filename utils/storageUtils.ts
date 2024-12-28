import AsyncStorage from "@react-native-async-storage/async-storage";

import UserLocation from "./model/UserLocation";
import {City} from "@/utils/model/city";
const saveLocationToAsyncStorage = async (location: UserLocation) => {
  try {
    const selectedCity = new City(
      null, // Key is null
      null, // Name is null,
      null, // Country is null
      location.latitude || null, // Latitude (nullable)
      location.longitude || null ,// Longitude (nullable)
      "primary" // Type is primary
    );

    console.log("City object created:", selectedCity);

    // Retrieve the existing cities array from AsyncStorage
    const storedCities = await AsyncStorage.getItem("cities");
    const cities = storedCities ? JSON.parse(storedCities) : [];

    // Add the new city to the array
    cities.push(selectedCity.toObject());

    // Save the updated cities array back to AsyncStorage
    await AsyncStorage.setItem("cities", JSON.stringify(cities));
    console.log("Cities updated in AsyncStorage:", cities);
    /// old 
    await AsyncStorage.setItem("userLocation", JSON.stringify(location));
    
    console.log("Location saved to Async Storage" ,JSON.stringify(location));
  } catch (e) {
    console.error(`Async storage error: ${e}`);
  }
};

export { saveLocationToAsyncStorage };
