interface CityWeatherInfo {
  key:string;
  name: string; // The name of the city
  country: string; // The name of the country
  weatherText: string; // Description of the weather (e.g., "Sunny", "Cloudy")
  temperature: number; // Current temperature in Celsius
}

const fetchCityWeatherInfo = async (
    latitude: number,
    longitude: number,
    apiKey: string
  ): Promise<CityWeatherInfo | null> => {
    const locationSearchUrl = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${latitude},${longitude}`;
    const currentConditionsUrl = (locationKey: string) =>
      `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}`;
  
    try {
      // Step 1: Get location info
      const locationResponse = await fetch(locationSearchUrl);
      if (!locationResponse.ok) {
        throw new Error("Failed to fetch location data");
      }
      const locationData = await locationResponse.json();
  
      const name = locationData.LocalizedName;
      const country = locationData.Country.LocalizedName;
      const locationKey = locationData.Key;
  
      // Step 2: Get weather info
      const weatherResponse = await fetch(currentConditionsUrl(locationKey));
      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const weatherData = await weatherResponse.json();
  
      const weatherText = weatherData[0].WeatherText;
      const temperature = weatherData[0].Temperature.Metric.Value;
  
      return {
        key:locationKey,
        name,
        country,
        weatherText,
        temperature,
      };
    } catch (error) {
      console.error("Error fetching city weather info:", error);
      return null;
    }
  };
  
  export default fetchCityWeatherInfo;
  