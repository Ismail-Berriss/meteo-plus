import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCUWEATHER_API_KEY } from "@/api";

const AddCityScreen = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigation = useRouter();

  const getAutocompleteSuggestions = useCallback(async () => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${ACCUWEATHER_API_KEY}&q=${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch autocomplete suggestions");
      }

      const data = await response.json();
      setSuggestions(data?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      setSuggestions([]);
    }
  }, [query]);

  const handleSelectCity = async (city) => {
    console.log("Selected city:", city);
    try {
      // 1. Fetch weather data
      const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${city.Key}?apikey=${ACCUWEATHER_API_KEY}`;
      const response = await fetch(weatherUrl);
      console.log("Weather response:", response);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await response.json();
      const weather = weatherData[0];

      // 2. Create city object
      const cityData = {
        key: city.Key,
        name: city.LocalizedName,
        country: city.Country.LocalizedName,
        latitude: city.GeoPosition?.Latitude || null,
        longitude: city.GeoPosition?.Longitude || null,
        type: "secondary",
        temperature: weather.Temperature?.Metric?.Value || null,
        weatherText: weather.WeatherText || "",
      };

      // 3. Retrieve the last used city ID from AsyncStorage
      const lastId = await AsyncStorage.getItem("lastCityId");
      const newId = lastId ? parseInt(lastId) + 1 : 1; // Default to 1 if no ID is stored
          console.log("newId",newId,"lastId",lastId);
      // 4. Save the new city with an auto-incremented ID in AsyncStorage
      await AsyncStorage.setItem(`city_${newId}`, JSON.stringify(cityData));

      // 5. Update the last city ID
      await AsyncStorage.setItem("lastCityId", newId.toString());

      console.log(`City saved with ID: city_${newId}`, cityData);

      navigation.push("/home");
    } catch (error) {
      console.error("Error in handleSelectCity:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={["#6d28d9", "#4c1d95"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            width: "90%",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Choose Your Main City
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f3f4f6",
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
                    backgroundColor: "#f3f4f6",
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 5,
                    marginBottom: 5,
                  }}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text>{`${item.LocalizedName}, ${item.Country.LocalizedName}`}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

export default AddCityScreen;
