import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Mic, Plus } from "lucide-react-native";
import  fetchCityWeatherInfo  from "@/utils/getWeatherByCord";
import { router } from "expo-router";
import { ACCUWEATHER_API_KEY } from "@/api";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fetchWeatherByCityKey from "@/utils/getWeatherByCityKey";
interface WeatherForecast {
  day: string;
  high: number;
  low: number;
}

const HomeScreen = () => {
  const [firstColor, setFirstColor] = useState<string>("#456bee");
  const [secondColor, setSecondColor] = useState<string>("#f0f8ff");
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<{
    cityName: string;
    countryName: string;
    temperature: number;
    weatherText: string;
  } | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);

 
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Step 1: Check if city key exists
        const cityKey = await AsyncStorage.getItem('city-key');
        
        if (cityKey) {
          // If city key exists, fetch weather by city key
          console.log("Fetching weather data by city key...");
          const weatherData = await fetchWeatherByCityKey(cityKey, ACCUWEATHER_API_KEY);
          console.log("Weather data:", weatherData);
          if (weatherData) {
            setWeatherInfo(weatherData);
            // Example static forecast data. Replace with actual API forecast if needed.
            setForecast([
              { day: "Monday", high: 24, low: 12 },
              { day: "Tuesday", high: 22, low: 10 },
              { day: "Wednesday", high: 26, low: 15 },
            ]);
          }
        } else {
          // Step 2: If no city key, fetch weather by coordinates (latitude and longitude)
          console.log("Fetching weather data by location...");
          const location = await AsyncStorage.getItem("userLocation");
          const parsedLocation = JSON.parse(location);

          if (parsedLocation) {
            const { latitude, longitude } = parsedLocation;
            
            if (latitude && longitude) {
              console.log("Latitude:", latitude, "Longitude:", longitude);
              const weatherData = await fetchCityWeatherInfo(latitude, longitude, ACCUWEATHER_API_KEY);
              
              if (weatherData) {
                setWeatherInfo(weatherData);
                setForecast([
                  { day: "Monday", high: 24, low: 12 },
                  { day: "Tuesday", high: 22, low: 10 },
                  { day: "Wednesday", high: 26, low: 15 },
                ]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        Alert.alert("Error", "Failed to fetch weather data.");
      }
    };

    fetchWeather();
  }, []); // Empty dependency array to run once on component mount

  const handleMicrophonePress = () => {
    setModalVisible(true);
    setTimeout(() => {
      setIsListening(true);
    }, 1500);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setIsListening(false);
  };

  return (
    <SafeAreaProvider>
      <LinearGradient colors={[firstColor, secondColor]} style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => router.push("/(root)/add-city")}
          >
            <Plus size={44} color="white" />
          </TouchableOpacity>

          <View style={styles.weatherContainer}>
            {weatherInfo ? (
              <>
                <Text style={styles.cityText}>{weatherInfo.cityName}</Text>
                <Text style={styles.countryText}>{weatherInfo.countryName}</Text>
                <Text style={styles.tempText}>{`${weatherInfo.temperature}°C`}</Text>
                <Text style={styles.weatherText}>{weatherInfo.weatherText}</Text>
              </>
            ) : (
              <ActivityIndicator size="large" color="#fff" />
            )}
          </View>

          <View>
            {forecast.map((item, index) => (
              <View key={index} style={styles.forecastRow}>
                <Text style={styles.forecastText}>{item.day}</Text>
                <Text style={styles.forecastText}>{`${item.high}°/${item.low}°`}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.micButton} onPress={handleMicrophonePress}>
          <Mic size={28} color="white" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Mic size={48} color="#007AFF" />
              {isListening ? (
                <Text style={styles.listeningText}>I'm listening...</Text>
              ) : (
                <Text style={styles.modalDescription}>Tap the mic and start talking!</Text>
              )}
              {isListening && (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
              )}
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weatherContainer: {
    alignItems: "center",
    paddingVertical: 36,
  },
  cityText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  countryText: {
    fontSize: 24,
    color: "#fff",
  },
  tempText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  weatherText: {
    fontSize: 20,
    color: "#fff",
    marginVertical: 10,
  },
  plusButton: {
    position: "absolute",
    top: 30,
    right: 20,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  forecastText: {
    fontSize: 20,
    color: "#fff",
  },
  micButton: {
    position: "fixed",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  listeningText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default HomeScreen;
