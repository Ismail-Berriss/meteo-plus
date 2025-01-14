import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  RectButton,
  Swipeable,
} from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Plus, Trash2, MapPin } from "lucide-react-native";

import { images } from "@/constants";
import City from "@/utils/model/city";
import { StorageUtils } from "@/utils/storage";
import { ACCUWEATHER_API_KEY } from "@/api";

const ManageCitiesScreen = () => {
  const navigation = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCityModal, setIsAddCityModal] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setIsLoading(true);
        const storedCities = await StorageUtils.loadCities();
        console.log("ManageCities - loaded cities:", storedCities);
        setCities(storedCities);
      } catch (error) {
        console.error("Error in loadCities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCities();
  }, []);

  const handleRemoveCity = async (cityName: string) => {
    // in here we can loop thro the 10 cicties we have and 
    const updatedCities = cities.filter((city) => city.name !== cityName);
    setCities(updatedCities);
    await AsyncStorage.setItem("cities", JSON.stringify(updatedCities));
  };

  const handleSetPrimaryCity = async (cityName: string) => {
    const updatedCities: City[] = cities.map((city: City) =>
      city.name === cityName
        ? { ...city, type: "primary" }
        : { ...city, type: "secondary" },
    );

    setCities(updatedCities);
    await AsyncStorage.setItem("cities", JSON.stringify(updatedCities));
  };

  const renderRightActions = (name: string) => (
    <RectButton
      style={styles.deleteButton}
      onPress={() => handleRemoveCity(name)}
    >
      <Trash2 color="white" />
    </RectButton>
  );

  const renderCityCard = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.name)}>
      <View style={styles.card}>
        <ImageBackground source={images.morning_list} resizeMode="cover">
          <View style={styles.cardContent}>
            <View>
              <View style={styles.cardHeader}>
                <Text style={styles.cityName}>{item.name}</Text>
                {item.type === "primary" && <MapPin color="white" size="18" />}
              </View>
            </View>
            <View>
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>
                  {parseInt(item.temperature)}
                </Text>
                <Text style={styles.tempIcon}>°C</Text>
              </View>
              <Text style={styles.weatherText}>{item.weatherText}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Swipeable>
  );

  const getAutocompleteSuggestions = useCallback(async () => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${ACCUWEATHER_API_KEY}&q=${query}`,
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
      console.log("newId", newId, "lastId", lastId);
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
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ImageBackground
          source={images.morning}
          style={styles.container}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <View style={styles.container}>
            <FlatList
              data={cities}
              keyExtractor={(item) => item.name!}
              renderItem={renderCityCard}
              contentContainerStyle={styles.list}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddCityModal(true)}
            >
              <Plus size={30} color="white" strokeWidth={1} />
              <Text style={styles.addButtonText}>Add City</Text>
            </TouchableOpacity>

            <Modal
              animationType="slide"
              transparent
              visible={isAddCityModal}
              onRequestClose={() => setIsAddCityModal(false)}
            >
              <View style={styles.modalOverlay}>
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
              </View>
            </Modal>
          </View>
        </ImageBackground>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 45,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Covers the entire screen
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  list: {
    // flexGrow: 1,
  },
  card: {
    marginBottom: 15,
    borderRadius: 6,
    overflow: "hidden",
  },
  cardContent: {
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cityName: {
    color: "white",
    fontSize: 18,
    marginRight: 4,
  },
  temperatureContainer: {
    flexDirection: "row",
  },
  temperature: {
    fontSize: 36,
    color: "white",
  },
  tempIcon: {
    fontSize: 20,
    color: "white",
  },
  weatherText: {
    fontSize: 12,
    color: "white",
    marginBottom: 5,
  },
  deleteButton: {
    marginBottom: 15,
    width: 80,
    borderRadius: 10,
    backgroundColor: "#ff4d4d",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 11,
  },
  icon: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ManageCitiesScreen;
