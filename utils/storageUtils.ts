import AsyncStorage from "@react-native-async-storage/async-storage";
import fetchCityWeatherInfo from "@/utils/getWeatherByCord";
import City from "@/utils/model/city";
import UserLocation from "./model/UserLocation";
import { ACCUWEATHER_API_KEY } from "@/api";
interface CityWeatherInfo {
  key: string;
  name: string; // The name of the city
  country: string; // The name of the country
  weatherText: string; // Description of the weather (e.g., "Sunny", "Cloudy")
  temperature: number; // Current temperature in Celsius
}

const saveLocationToAsyncStorage = async (location: UserLocation) => {
  try {
    const city: CityWeatherInfo = await fetchCityWeatherInfo(
      location.getLatitude(),
      location.getLongitude(),
      ACCUWEATHER_API_KEY,
    );
    console.log("City weather info:", city);
    console.log("city key of coord ",city.key);

    const selectedCity = new City(
      city?.key || "", // Handle missing key
      city?.name || "", // Handle missing name
      city?.country || "", // Handle missing country
      location.getLatitude(),
      location.getLongitude(),
      "primary",
      city?.temperature || 0,

      city?.weatherText || "",
    );

    console.log("City object created:", selectedCity);

    // Retrieve the existing cities array from AsyncStorage
    // const storedCities = await AsyncStorage.getItem("cities");
    // const cities = storedCities ? JSON.parse(storedCities) : [];

    // // Add the new city to the array
    // cities.push(selectedCity.toObject());

    // Save the updated cities array back to AsyncStorage
    await AsyncStorage.setItem("city_1", JSON.stringify(selectedCity));
    await AsyncStorage.setItem("lastCityId", "1");

    //console.log("Cities updated in AsyncStorage:", cities);
    /// old
    await AsyncStorage.setItem("userLocation", JSON.stringify(location));

    console.log("Location saved to Async Storage", JSON.stringify(location));
  } catch (e) {
    console.error(`Async storage error: ${e}`);
  }
};

export { saveLocationToAsyncStorage };
