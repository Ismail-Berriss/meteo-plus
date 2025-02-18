import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
  ImageBackground,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";
import { Audio } from "expo-av";
import * as Location from "expo-location";

import axios from "axios";
import {
  Compass,
  Droplets,
  MapPin,
  MapPinOff,
  Mic,
  Plus,
  ThermometerSun,
  Wind,
} from "lucide-react-native";
import { Buffer } from "buffer";

import { images } from "@/constants";
import { ACCUWEATHER_API_KEY } from "@/api";
import { getMicrophonePermission } from "@/utils/permissionsUtils";
import fetchCityWeatherInfo from "@/utils/getWeatherByCord";
import fetchWeatherByCityKey from "@/utils/getWeatherByCityKey";
import { prompt_assistant } from "@/utils/prompt";
import City from "@/utils/model/city";
import { WeatherForecast, WeatherInfo } from "@/types/type";
import {weatherIconMap} from "@/constants";
interface RecordingOptions {
  android: {
    extension: string;
    outPutFormat: number;
    androidEncoder: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
  };
  ios: {
    extension: string;
    audioQuality: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth: number;
    linearPCMIsBigEndian: boolean;
    linearPCMIsFloat: boolean;
  };
}
interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

const HomeScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [forecast, setForecast] = useState<{
    [key: string]: WeatherForecast[];
  }>({});
  const [citiesWeather, setCitiesWeather] = useState<(WeatherInfo | null)[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistext, setAssistext] = useState<string>("");
  const [assisreply, setAssisreply] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(false); // For text response
  const [isVoiceLoading, setIsVoiceLoading] = useState(false); // For voice response

  const [recording, setRecording] = useState<Audio.Recording>();

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

  const fetchForecastWeather = async (city: City) => {
    try {
      if (!city.key) {
        console.error(`No city key available for ${city.name}`);
        return null;
      }

      const response = await fetch(
        `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${city.key}?apikey=${ACCUWEATHER_API_KEY}&metric=true&details=true`,
      );

      if (!response.ok) {
        console.error(
          `Error fetching forecast for city ${city.name}:`,
          response.statusText,
        );
        return null;
      }

      const data = await response.json();

      if (
        !data ||
        !data.DailyForecasts ||
        !Array.isArray(data.DailyForecasts)
      ) {
        console.error(`Invalid data received for city ${city.name}:`, data);
        return null;
      }

      const forecasts = data.DailyForecasts.map((forecast: any) => ({
        icon: forecast.Day.Icon,
        day: new Date(forecast.Date).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        high: Math.round(forecast.Temperature.Maximum.Value),
        low: Math.round(forecast.Temperature.Minimum.Value),
        dayNumber: new Date(forecast.Date).toLocaleDateString("en-US", {
          day: "numeric",
        }),
        monthNumber: new Date(forecast.Date).toLocaleDateString("en-US", {
          month: "numeric",
        }),
        phrase: forecast.Day.IconPhrase,
      }));

      return forecasts;
    } catch (error) {
      console.error(`Error fetching forecast for city ${city.name}:`, error);
      return null;
    }
  };

  const fetchCurrentConditions = async (cityKey: string) => {
    try {
      const response = await axios.get(
        `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`,
      );
      if (response.data && response.data.length > 0) {
        const condition = response.data[0];

        const getWindDirection = (degree) => {
          const directions = [
            "North",
            "Northeast",
            "East",
            "Southeast",
            "South",
            "Southwest",
            "West",
            "Northwest",
          ];
          const index = Math.round(degree / 45) % 8; // Dividing by 90 for cardinal directions
          return directions[index];
        };

        console.log(
          `directions: ${getWindDirection(condition.Wind.Direction.Degrees)}`,
        );

        return {
          windSpeed: condition.Wind.Speed.Metric.Value,
          humidity: condition.RelativeHumidity,
          windDirection: getWindDirection(condition.Wind.Direction.Degrees),
          realFeel: condition.RealFeelTemperature.Metric.Value,
        };
      }
      return null;
    } catch (error) {
      console.error(
        `Error fetching current conditions for city ${cityKey}:`,
        error,
      );
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
        try {
          if (city.key) {
            // Fetch both current conditions and forecast concurrently
            const [currentConditions, forecastData] = await Promise.all([
              fetchCurrentConditions(city.key),
              fetchWeatherByCityKey(city.key, ACCUWEATHER_API_KEY),
            ]);
            // Merge the forecast and current condition data
            return {
              ...forecastData,
              ...currentConditions,
              key: city.key,
              name: city.name,
              country: city.country,
              type: city.type,
            };
          } else if (city.latitude !== null && city.longitude !== null) {
            const weatherInfo = await fetchCityWeatherInfo(
              city.latitude,
              city.longitude,
              city.type,
              ACCUWEATHER_API_KEY,
            );
            return weatherInfo;
          }
          return null;
        } catch (error) {
          console.error("Error fetching weather for city:", error);
          return null;
        }
      });

      console.log(weatherPromises);
      const weatherResults = await Promise.all(weatherPromises);
      setCitiesWeather(weatherResults.filter(Boolean));

      // Fetch forecasts for all cities
      const forecasts = await Promise.all(
        loadedCities.map(async (city) => {
          const forecastData = await fetchForecastWeather(city);
          return { key: city.key, data: forecastData };
        }),
      );

      // Convert array of forecasts to object with city keys
      const forecastObject = forecasts.reduce(
        (acc, curr) => {
          if (curr.key && curr.data) {
            acc[curr.key] = curr.data;
          }
          return acc;
        },
        {} as { [key: string]: WeatherForecast[] },
      );

      setForecast(forecastObject);
    } catch (error) {
      console.error("Error fetching cities weather:", error);
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherForCities();
  }, []);

  const handleRefresh = async () => {
    setRefresh(true);
    await fetchWeatherForCities();
    setRefresh(false);
  };

  /// this is voice assistant logic
  const recordingOptions: RecordingOptions = {
    android: {
      extension: ".mp3",
      outPutFormat: Audio.AndroidOutputFormat.MPEG_4,
      androidEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 48000, // Higher sample rate for better audio quality
      numberOfChannels: 2, // Stereo recording
      bitRate: 192000,
    },
    ios: {
      extension: ".mp3",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  ///--------------- start recording func--------------
  const startRecording = async () => {
    try {
      const hasPermission = await getMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record audio.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setIsRecording(true);
      setRecording(recording);

      console.log("Recording started successfully");
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  ///------------------------------------
  const stopRecording = async () => {
    try {
      if (!recording || !isRecording) {
        console.log("No active recording to stop");
        return;
      }

      setIsRecording(false);
      console.log("Stopping recording...");

      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();

      if (!uri) {
        throw new Error("Recording URI is undefined");
      }

      await uploadRecording(uri);
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to process recording. Please try again.");
    }
  };

  //-------------------------------
  const uploadRecording = async (uri: string) => {
    try {
      setIsTextLoading(true); // Start loading for text response
      setIsVoiceLoading(true); // Start loading for voice response

      console.log("Starting audio upload with URI:", uri);

      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        type: "audio/mp3",
        name: "recording.mp3",
      } as any);

      // Step 1: Get transcription
      const transcriptionResponse = await axios.post(
        "https://aeee-160-179-5-246.ngrok-free.app/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      const transcript =
        transcriptionResponse.data.transcriptions[0]?.transcript;
      console.log("Transcription:", transcript);

      // Step 2: Get text response from Gemini
      const assistantResponseText = await sendToGemini(
        prompt_assistant,
        transcript,
      );

      // Update assistant reply state
      setAssistext(assistantResponseText);
      setAssisreply(true);
      setIsTextLoading(false); // Text response received, stop loading

      // Step 3: Get voice response and play it
      await playAssistantResponse(assistantResponseText);
      setIsVoiceLoading(false); // Voice response received, stop loading
    } catch (error) {
      console.error("Error uploading recording:", error);
      Alert.alert("Error", "Failed to upload recording. Please try again.");
      setIsTextLoading(false); // Stop loading on error
      setIsVoiceLoading(false); // Stop loading on error
    }
  };

  //-------------------------------
  const playAssistantResponse = async (text: string) => {
    try {
      const responseAudio = await axios.post(
        "https://api.play.ht/api/v2/tts/stream",
        {
          text,
          voice_engine: "Play3.0-mini",
          voice:
            "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
          output_format: "mp3",
        },
        {
          headers: {
            "X-USER-ID": "c4tWRiKDPdXnmkX8A4tBaMukT7k1",
            AUTHORIZATION: "6b91dd8a331249ff9623014eb8533293",
            accept: "audio/mpeg",
            "content-type": "application/json",
          },
          responseType: "arraybuffer",
        },
      );

      const base64Audio = `data:audio/mp3;base64,${Buffer.from(responseAudio.data).toString("base64")}`;
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: base64Audio });
      await soundObject.playAsync();
    } catch (error) {
      console.error("Error during audio playback:", error);
      setIsVoiceLoading(false); // Stop loading on error
    }
  };

  //-------------------------------
  const handleModalClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setModalVisible(false);
  };

  const handleMicrophonePress = () => {
    setModalVisible(true);
    setTimeout(() => {
      setIsListening(true);
    }, 1500);
  };

  const renderWeatherPage = async (weatherInfo: WeatherInfo | null) => (
    <View style={styles.weatherContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : weatherInfo ? (
        <>
          {/* Start Main Weather Information */}
          <View style={styles.topWeatherContainer}>
            {/* Start City Text */}
            <View style={styles.cityTextContainer}>
              <Text style={styles.cityText}>{weatherInfo.name}</Text>
              {weatherInfo.type === "primary" ? (
                (await Location.hasServicesEnabledAsync()) ? (
                  <MapPin color="white" size="26" />
                ) : (
                  <MapPinOff color="white" size="26" />
                )
              ) : null}
            </View>
            {/* End City Text */}

            {/* Start Tempreture */}
            <View style={styles.temperatureContainer}>
              <Text style={styles.tempText}>
                {Math.trunc(weatherInfo.temperature!)}
              </Text>
              <Text style={styles.tempIcon}>°C</Text>
            </View>
            {/* End Tempreture */}

            {/* Start Weather Text */}
            <Text style={styles.weatherText}>{weatherInfo.weatherText}</Text>
            {/* End Weather Text */}
          </View>

          {/* Start Forcast */}
          <View style={styles.forecastContainer}>
            {weatherInfo.key && forecast[weatherInfo.key] ? (
              forecast[weatherInfo.key].map((item, index) => (
                <View key={index} style={styles.forecastRow}>
                  {/* Start Forcast Day */}
                  <Text style={styles.forecastDay}>{item.day}</Text>
                  <Text style={styles.forecastDate}>
                    {item.monthNumber}/{item.dayNumber}
                  </Text>
                  <Image
                    source={weatherIconMap[item.icon]|| images.cloud}
                    style={styles.weatherIcons}
                    
                  />
                  <Text style={styles.forecastPhrase}>{item.phrase} {item.icon} </Text>
                  {/* End Forcast Day */}

                  {/* Start Forcast Tempreture */}
                  <Text style={styles.forecastTemp}>
                    {`${item.high}°/${item.low}°`}
                  </Text>
                  {/* End Forcast Tempreture */}
                </View>
              ))
            ) : (
              <Text style={styles.errorText}>No forecast available</Text>
            )}
          </View>
          {/* End Forcast */}

          {/* Current Conditions Card */}
          <View style={styles.currentConditionsContainer}>
            <Text style={styles.currentConditionsTitle}>
              Current Conditions
            </Text>
            <View style={styles.conditionsContainer}>
              <View style={styles.conditionItem}>
                <Wind color="white" size={33} />
                <Text style={styles.conditionLabel}>Wind Speed</Text>
                <Text style={styles.conditionValue}>
                  {weatherInfo.windSpeed} km/h
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Droplets color="white" size={33} />
                <Text style={styles.conditionLabel}>Humidity</Text>
                <Text style={styles.conditionValue}>
                  {weatherInfo.humidity}%
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Compass color="white" size={33} />
                <Text style={styles.conditionLabel}>Wind Direction</Text>
                <Text style={styles.conditionValue}>
                  {weatherInfo.windDirection}
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <ThermometerSun color="white" size={33} />
                <Text style={styles.conditionLabel}>Real Feel</Text>
                <Text style={styles.conditionValue}>
                  {weatherInfo.realFeel}°C
                </Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>No weather data available</Text>
      )}
    </View>
  );

  const getClothsFromApi = async (prompt_user: string) => {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const GEMINI_API_KEY = "AIzaSyCcWWbB0FzPrZqeehhZPfzITbBLWYXcycY";
    const final_promot = prompt_assistant + prompt_user;
    const formdata = new FormData();
    formdata.append("", final_promot);
    const assistant_text_response = await axios.post(GEMINI_API_URL);
  };

  /// we could send the primary city with the prompt
  async function sendToGemini(
    prompt: string,
    userText: string,
  ): Promise<string> {
    const GEMINI_API_URL =
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
    const GEMINI_API_KEY = "AIzaSyCcWWbB0FzPrZqeehhZPfzITbBLWYXcycY"; // Replace with your actual API key.

    const requestPayload = {
      contents: [
        {
          parts: [{ text: `${prompt} ${userText}` }],
        },
      ],
    };

    try {
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
     // setAssisloading(true);
      if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setAssisreply(true);
        console.log(
          "inside gem",
          response.data.candidates?.[0]?.content.parts[0].text,
        );
        return response.data.candidates?.[0]?.content.parts[0].text;
      } else {
        throw new Error("No content generated by Gemini API");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Gemini API Error:", error.response.data);
        throw new Error(`Gemini API Error: ${error.response.statusText}`);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={images.sunnybg}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Start Plus Icon */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => router.push("/(root)/manageCities")}
        >
          <Plus size={33} color="white" />
        </TouchableOpacity>
        {/* End Plus Icon */}

        {/* Start Weather Info */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={handleRefresh} />
          }
        >
          <Swiper
            loop={false}
            showsPagination={true}
            dotStyle={styles.dot}
            activeDotStyle={styles.activeDot}
          >
            {citiesWeather.length > 0 ? (
              citiesWeather.map((weather, index) => (
                <View key={index} style={styles.slide}>
                  {renderWeatherPage(weather)}
                </View>
              ))
            ) : (
              <View style={styles.slide}>
                <Text style={styles.noDataText}>
                  No cities added yet...pull down to refresh
                </Text>
              </View>
            )}
          </Swiper>
        </ScrollView>
        {/* End Weather Info */}

        {/* Start Voice Assistance */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => setModalVisible(true)}
        >
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
              {isRecording ? (
                <Text style={styles.listeningText}>I'm listening...</Text>
              ) : (
                <Text style={styles.modalDescription}>
                  Tap the button and start talking!
                </Text>
              )}

              {isRecording && (
                <ActivityIndicator
                  size="large"
                  color="#007AFF"
                  style={{ marginTop: 20 }}
                />
              )}

              {/* Show loading for text response */}
              {isTextLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>
                    Waiting for assistant's text response...
                  </Text>
                </View>
              )}

              {/* Show loading for voice response */}
              {isVoiceLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>
                    Waiting for assistant's voice response...
                  </Text>
                </View>
              )}

              {/* Show assistant's response */}
              {assisreply && !isTextLoading && !isVoiceLoading && (
                <Text style={styles.transcriptText}>{assistext}</Text>
              )}

              <TouchableOpacity
                style={styles.recordButton}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.recordButtonText}>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleModalClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* End Voice Assistance */}
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  // Main Container Styles
  container: {
    flex: 1,
  },
  plusButton: {
    position: "absolute",
    top: 25,
    right: 7,
    zIndex: 1,
    padding: 8,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
  },
  weatherContainer: {
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  topWeatherContainer: {
    flexBasis: "35%",
    justifyContent: "center",
    alignItems: "center",
  },
  cityTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cityText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  temperatureContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tempText: {
    fontSize: 80,
    color: "#fff",
    textAlign: "center",
  },
  tempIcon: {
    fontSize: 35,
    color: "white",
  },
  weatherText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginVertical: 10,
  },
  forecastContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "95%",
    paddingHorizontal: 5,
  },
  forecastRow: {
    flexBasis: "20%",
    alignItems: "center",
    rowGap: 5,
  },
  forecastDay: {
    fontSize: 12,
    color: "#fff",
  },
  forecastDate: {
    fontSize: 12,
    color: "white",
  },
  weatherIcons: {
    width: 30,
    height: 30,
  },
  forecastPhrase: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  forecastTemp: {
    color: "white",
    fontSize: 12,
  },
  // Current Conditions
  currentConditionsContainer: {
    width: "90%",
    flexBasis: "37%",
  },
  currentConditionsTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  conditionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  conditionItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  conditionLabel: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.8,
  },
  conditionValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 5,
  },

  // Navigation and Control Styles
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
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginVertical: 16,
    color: "#333",
  },
  recordButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  recordButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  // Loading and Error States
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noDataText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Transcript Styles
  transcriptText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
    paddingHorizontal: 15,
  },
});

export default HomeScreen;