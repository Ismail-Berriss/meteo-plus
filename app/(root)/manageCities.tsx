import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Plus } from "lucide-react-native";

import { images } from "@/constants";
import City from "@/utils/model/city";
import CustomButton from "@/components/CustomButton";
import { StorageUtils } from "@/utils/storage";
const ManageCitiesScreen = () => {
  const [cities, setCities] = useState<City[]>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);
  const loadCities = async () => {
    try {
      setIsLoading(true);
      const storedCities = await StorageUtils.loadCities();
      console.log('ManageCities - loaded cities:', storedCities);
      setCities(storedCities);
    } catch (error) {
      console.error('Error in loadCities:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRemoveCity = async (cityName: string) => {
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

  const renderCityCard = ({ item }) => (
    <View style={styles.card}>
      <ImageBackground source={images.morning_list} resizeMode="cover">
        <View style={styles.cardContent}>
          <View>
            <View style={styles.cardHeader}>
              <Text style={styles.cityName}>{item.name}</Text>
              {item.type === "primary" && (
                <Ionicons
                  name="star"
                  size={20}
                  color="#fbbf24"
                  style={styles.icon}
                />
              )}
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
          {/* <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.button,
              item.type === "primary" && styles.primaryButton,
            ]}
            onPress={() => handleSetPrimaryCity(item.name!)}
          >
            <Text style={styles.buttonText}>
              {item.type === "primary" ? "Primary City" : "Set as Primary"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.removeButton]}
            onPress={() => handleRemoveCity(item.name!)}
          >
            <Text style={styles.buttonText}>Remove</Text>
          </TouchableOpacity>
        </View> */}
        </View>
      </ImageBackground>
    </View>
  );

  return (
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
            onPress={() => router.push("/add-city")}
          >
            <Plus size={30} color="white" strokeWidth={1} />
            <Text style={styles.addButtonText}>Add City</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
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
  },
  temperatureContainer: {
    flexDirection: "row",
  },
  temperature: {
    fontSize: 36,
    color: "white",
  },
  tempIcon: {
    fontSize: 24,
    color: "white",
  },
  weatherText: {
    fontSize: 12,
    color: "white",
    marginBottom: 5,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#6d28d9",
    flex: 1,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: "#4c1d95",
  },
  removeButton: {
    backgroundColor: "#dc2626",
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
});

export default ManageCitiesScreen;
