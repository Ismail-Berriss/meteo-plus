import AsyncStorage from "@react-native-async-storage/async-storage";

interface WeatherInfo {
    cityName: string;
    countryName: string;
    weatherText: string;
    temperature: number; // In Celsius
  }
  
  const fetchWeatherByCityKey = async (
    cityKey: string,
    apiKey: string
  ): Promise<WeatherInfo | null> => {
    const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${apiKey}`;
  
    try {
      // Fetch the weather data using the cityKey
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }
  
      const weatherData = await weatherResponse.json();
  
      // Check if the weatherData is valid and contains the expected structure
      if (!weatherData || weatherData.length === 0) {
        throw new Error("No weather data found for the provided city key.");
      }
  
      // Extract weather details from the API response
      const weather = weatherData[0];
  
      // Fetch the city name and country name from AsyncStorage
      const cityNameFromStorage = await AsyncStorage.getItem("city-name");
      const countryNameFromStorage = await AsyncStorage.getItem("country-name");
  
      // Default to the values from AsyncStorage if available, otherwise use data from API
      const cityName = cityNameFromStorage || weather.LocalizedName || "Unknown City";
      const countryName = countryNameFromStorage || "Unknown Country"; // Assuming you have country info in AsyncStorage
  
      const weatherText = weather.WeatherText || "No weather information available";
      const temperature = weather.Temperature?.Metric?.Value || 0;
  
      // Return the weather info
      return {
        cityName,
        countryName,
        weatherText,
        temperature,
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return null;
    }
  };
  
  export default fetchWeatherByCityKey;
  