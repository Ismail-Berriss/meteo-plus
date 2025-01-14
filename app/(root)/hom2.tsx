import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ScrollView,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from "react-native";
import axios from "axios";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Mic, Plus } from "lucide-react-native";
import { router } from "expo-router";
import { ACCUWEATHER_API_KEY } from "@/api";
import { images } from "@/constants";
import { WeatherForecast, WeatherInfo } from "@/types/type";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HomeScreen = () => {
  const [forecast, setForecast] = useState<{ [key: string]: WeatherForecast[] }>({});
  const [citiesWeather, setCitiesWeather] = useState<(WeatherInfo | null)[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(false);

  const loadCities = async (): Promise<City[]> => {
    try {
      const cities: City[] = [];
      for (let i = 1; i <= 10; i++) {
        const cityKey = `city_${i}`;
        const cityData = await AsyncStorage.getItem(cityKey);

        if (cityData) {
          cities.push(JSON.parse(cityData));
        }
      }
      return cities;
    } catch (error) {
      console.error("Error loading cities:", error);
      return [];
    }
  };

  const fetchCurrentConditions = async (cityKey: string) => {
    try {
      const response = await axios.get(
        `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${ACCUWEATHER_API_KEY}`
      );
      if (response.data && response.data.length > 0) {
        const condition = response.data[0];
        return {
          windSpeed: condition.Wind.Speed.Metric.Value,
          humidity: condition.RelativeHumidity,
          realFeel: condition.RealFeelTemperature.Metric.Value,
          uvIndex: condition.UVIndex,
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching current conditions for city ${cityKey}:`, error);
      return null;
    }
  };

  const fetchWeatherForCities = async () => {
    try {
      setIsLoading(true);
      const loadedCities = await loadCities();
      if (loadedCities.length === 0) {
        setIsLoading(false);
        return;
      }
      setCities(loadedCities);

      const weatherPromises = loadedCities.map(async (city) => {
        if (city.key) {
          const weatherInfo = await fetchCurrentConditions(city.key);
          return { ...city, ...weatherInfo };
        }
        return null;
      });

      const weatherResults = await Promise.all(weatherPromises);
      setCitiesWeather(weatherResults.filter(Boolean));

    } catch (error) {
      console.error("Error fetching weather data:", error);
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    await fetchWeatherForCities();
    setRefresh(false);
  };

  const toggleCityExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCities((prevExpanded) =>
      prevExpanded.includes(index)
        ? prevExpanded.filter((i) => i !== index)
        : [...prevExpanded, index]
    );
  };

  const renderWeatherPage = (weatherInfo: WeatherInfo | null, index: number) => (
    <View style={styles.weatherContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : weatherInfo ? (
        <>
          <TouchableOpacity onPress={() => toggleCityExpand(index)}>
            <Text style={styles.cityText}>{weatherInfo.name}</Text>
            <Text style={styles.countryText}>{weatherInfo.country}</Text>
            <Text style={styles.tempText}>{`${Math.trunc(weatherInfo.temperature!)}°C`}</Text>
            <Text style={styles.weatherText}>{weatherInfo.weatherText}</Text>
          </TouchableOpacity>

          {expandedCities.includes(index) && (
            <View style={styles.additionalDataContainer}>
              <Text style={styles.additionalDataText}>
                Wind Speed: {weatherInfo.windSpeed} km/h
              </Text>
              <Text style={styles.additionalDataText}>
                Humidity: {weatherInfo.humidity}%
              </Text>
              <Text style={styles.additionalDataText}>
                Real Feel: {weatherInfo.realFeel}°C
              </Text>
              <Text style={styles.additionalDataText}>
                UV Index: {weatherInfo.uvIndex}
              </Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.errorText}>No weather data available</Text>
      )}
    </View>
  );

  useEffect(() => {
    fetchWeatherForCities();
  }, []);

  return (
    <SafeAreaProvider>
      <ImageBackground source={images.morning} style={styles.container} resizeMode="cover">
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={handleRefresh} />}>
          <Swiper loop={false} showsPagination paginationStyle={styles.pagination}>
            {citiesWeather.length > 0 ? (
              citiesWeather.map((weather, index) => (
                <View key={index} style={styles.slide}>
                  {renderWeatherPage(weather, index)}
                </View>
              ))
            ) : (
              <View style={styles.slide}>
                <Text style={styles.noDataText}>No cities added yet... pull down to refresh</Text>
              </View>
            )}
          </Swiper>
        </ScrollView>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, justifyContent: "center" },
  weatherContainer: { alignItems: "center", paddingVertical: 36 },
  additionalDataContainer: { marginTop: 10 },
  additionalDataText: { fontSize: 16, color: "#fff", textAlign: "center" },
  cityText: { fontSize: 36, fontWeight: "bold", color: "#fff", textAlign: "center" },
  countryText: { fontSize: 24, color: "#fff", textAlign: "center" },
  tempText: { fontSize: 48, fontWeight: "bold", color: "#fff", textAlign: "center" },
  weatherText: { fontSize: 20, color: "#fff", textAlign: "center" },
  pagination: { bottom: 100 },
  noDataText: { fontSize: 20, color: "#fff", textAlign: "center", marginBottom: 20 },
  errorText: { fontSize: 18, color: "#fff", textAlign: "center", marginTop: 20 },
});

export default HomeScreen;
