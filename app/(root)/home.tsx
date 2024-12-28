import { useEffect, useState } from "react";
import {ActivityIndicator,Alert,Modal,StyleSheet,Text,TouchableOpacity,View,} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Mic, Plus } from "lucide-react-native";
import fetchCityWeatherInfo from "@/utils/getWeatherByCord";
import { router } from "expo-router";
import { ACCUWEATHER_API_KEY } from "@/api";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fetchWeatherByCityKey from "@/utils/getWeatherByCityKey";
import Swiper from "react-native-swiper";
import City from "@/utils/model/city";
interface WeatherForecast {
  day: string;
  high: number;
  low: number;
}

interface WeatherInfo {
  name: string;
  country: string;
  temperature: number;
  weatherText: string;
}


const HomeScreen = () => {
  const [firstColor, setFirstColor] = useState<string>("#456bee");
  const [secondColor, setSecondColor] = useState<string>("#f0f8ff");
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [citiesWeather, setCitiesWeather] = useState<(WeatherInfo | null)[]>([]);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  useEffect(() => {
    const fetchWeatherForCities = async () => {
      try {
        // Get cities from AsyncStorage
        const citiesString = await AsyncStorage.getItem('cities');
        console.log("cities upon home first call ", citiesString);
        if (!citiesString) {
          console.log("No cities found in storage");
          return;
        }
  
        const cities: City[] = JSON.parse(citiesString);
        const firstTwoCities = cities.slice(0, 2);
        console.log("firstTwoCities", firstTwoCities);
        // Fetch weather for each city
        const weatherPromises = firstTwoCities.map(async (city, index) => {
          try {
            let weatherInfo = null;

            if (city.key) {
              // If city has a city key, fetch weather using that
              weatherInfo = await fetchWeatherByCityKey(city.key, ACCUWEATHER_API_KEY);
              console.log("fetch weather info of key in HOME", weatherInfo);
              return weatherInfo;
            } else if (city.latitude && city.longitude) {
              // If city has coordinates, fetch weather using those
              console.log("fetch coord", city);
              weatherInfo = await fetchCityWeatherInfo(
                city.latitude,
                city.longitude,
                ACCUWEATHER_API_KEY
              );

        
              if (weatherInfo && index === 0) {
                // Update the first city in the array with fetched details
                setCitiesWeather((prevCities) => {
                  const updatedCities = [...prevCities];
                  updatedCities[0] = {
                    ...updatedCities[0],
                    name: weatherInfo.name,
                    country: weatherInfo.country,
                    latitude:city.latitude,
                    longitude: city.longitude,
                    weatherText: weatherInfo.weatherText,
                    temperature: weatherInfo.temperature,
                  };
                  // Save updated cities to AsyncStorage
                  AsyncStorage.setItem("cities", JSON.stringify(updatedCities));
                  return updatedCities;
                });
              }
              return weatherInfo;
            }
            
          } catch (error) {
            console.error("Error fetching weather for city:", error);
            return null;
          }
        });
        
        const weatherResults = await Promise.all(weatherPromises);
  
        setCitiesWeather(weatherResults);
     
  
        // Set static forecast data (replace with actual API call if needed)
        setForecast([
          { day: "Monday", high: 24, low: 12 },
          { day: "Tuesday", high: 22, low: 10 },
          { day: "Wednesday", high: 26, low: 15 },
        ]);
      } catch (error) {
        console.error("Error fetching cities weather:", error);
        Alert.alert("Error", "Failed to fetch weather data.");
      }
    };
  
    fetchWeatherForCities();
  }, []);
  

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

  const renderWeatherPage = (weatherInfo: WeatherInfo | null) => (
    <View style={styles.weatherContainer}>
      {weatherInfo ? (
        <>
          <Text style={styles.cityText}>{weatherInfo.name}</Text>
          <Text style={styles.countryText}>{weatherInfo.country}</Text>
          <Text style={styles.tempText}>{`${weatherInfo.temperature}°C`}</Text>
          <Text style={styles.weatherText}>{weatherInfo.weatherText}</Text>
          
          <View style={styles.forecastContainer}>
            {forecast.map((item, index) => (
              <View key={index} style={styles.forecastRow}>
                <Text style={styles.forecastText}>{item.day}</Text>
                <Text style={styles.forecastText}>{`${item.high}°/${item.low}°`}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color="#fff" />
      )}
    </View>
  );

  return (
    <SafeAreaProvider>
      <LinearGradient colors={[firstColor, secondColor]} style={styles.container}>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => router.push("/(root)/manageCities")}
        >
          <Plus size={44} color="white" />
        </TouchableOpacity>

        <Swiper
          loop={false}
          showsPagination={true}
          paginationStyle={styles.pagination}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        >
          {citiesWeather.map((weather, index) => (
            <View key={index} style={styles.slide}>
              {renderWeatherPage(weather)}
            </View>
          ))}
        </Swiper>

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
  slide: {
    flex: 1,
    justifyContent: "center",
  },
  weatherContainer: {
    alignItems: "center",
    paddingVertical: 36,
  },
  forecastContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
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
    zIndex: 1,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  forecastText: {
    fontSize: 20,
    color: "#fff",
  },
  pagination: {
    bottom: 100,
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.3)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  micButton: {
    position: "absolute",
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