import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

const ManageCitiesScreen = () => {
  const [cities, setCities] = useState([]);
  const router = useRouter();

  useEffect(() => {
   
      const loadCities = async () => {
        const storedCities = await AsyncStorage.getItem("cities");
        console.log(" IAM manage ciyies :storedCities", storedCities);
        setCities(storedCities ? JSON.parse(storedCities) : []);
      };

      loadCities();
   
  },[]);

  const handleRemoveCity = async (cityName) => {
    const updatedCities = cities.filter((city) => city.name !== cityName);
    setCities(updatedCities);
    await AsyncStorage.setItem("cities", JSON.stringify(updatedCities));
  };

  const handleSetPrimaryCity = async (cityName) => {
    const updatedCities = cities.map((city) =>
      city.name === cityName
        ? { ...city, type: "primary" }
        : { ...city, type: "secondary" }
    );

    setCities(updatedCities);
    await AsyncStorage.setItem("cities", JSON.stringify(updatedCities));
  };

  const renderCityCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cityName}>{item.name}</Text>
        {item.type === "primary" && (
          <Ionicons name="star" size={20} color="#fbbf24" style={styles.icon} />
        )}
      </View>
      <Text style={styles.weatherText}>{item.weatherText}</Text>
      <Text style={styles.temperature}>{item.temperature}°C</Text>
      <Text style={styles.country}>{item.country}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.button,
            item.type === "primary" && styles.primaryButton,
          ]}
          onPress={() => handleSetPrimaryCity(item.name)}
        >
          <Text style={styles.buttonText}>
            {item.type === "primary" ? "Primary City" : "Set as Primary"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.removeButton]}
          onPress={() => handleRemoveCity(item.name)}
        >
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <LinearGradient colors={["#bfeff5", "#7ea0fc"]} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Manage Cities</Text>
          <FlatList
            data={cities}
            keyExtractor={(item) => item.name}
            renderItem={renderCityCard}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-city")}
          >
            <Text style={styles.addButtonText}>Add City</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 40,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginVertical: 20,
  },
  list: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cityName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weatherText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 5,
  },
  temperature: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  country: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 10,
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
    backgroundColor: "#6d28d9",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {
    marginLeft: 10,
  },
});

export default ManageCitiesScreen;
