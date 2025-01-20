import AsyncStorage from "@react-native-async-storage/async-storage";

interface WeatherInfo {
  name: string;
  country: string;
  weatherText: string;
  temperature: number; // In Celsius
  type: string;
}

const getCitiesFromStorage = async (): Promise<any[] | null> => {
  try {
    const citiesString = await AsyncStorage.getItem("cities");
    return citiesString ? JSON.parse(citiesString) : null;
  } catch (error) {
    console.error("Error retrieving cities from AsyncStorage:", error);
    return null;
  }
};

const fetchWeatherData = async (
  cityKey: string,
  apiKey: string,
): Promise<any | null> => {
  const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${apiKey}`;
  try {
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error("Failed to fetch weather data");
    }
    const weatherData = await weatherResponse.json();
    return weatherData?.[0] || null;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

const fetchWeatherByCityKey = async (
  cityKey: string,
  apiKey: string,
): Promise<WeatherInfo | null> => {
  try {
    // Fetch weather data from API
    const weather = await fetchWeatherData(cityKey, apiKey);

    if (!weather) {
      throw new Error("No weather data found for the provided city key.");
    }

    // Retrieve cities from AsyncStorage
    const cities = await getCitiesFromStorage();

    let name = "Unknown City";
    let country = "Unknown Country";

    if (cities && cities.length > 1) {
      const secondCity = cities[1]; // Access the second item in the array
      name = secondCity?.name || name;
      country = secondCity?.country || country;
    } else {
      console.warn(
        "Second city is null, undefined, or the cities array is empty.",
      );
    }

    const weatherText =
      weather.WeatherText || "No weather information available";
    const temperature = weather.Temperature?.Metric?.Value || 0;

    // Return the consolidated weather info
    return {
      name,
      country,
      weatherText,
      temperature,
      type: "primary",
    };
  } catch (error) {
    console.error("Error fetching weather by city key:", error);
    return null;
  }
};

export default fetchWeatherByCityKey;
