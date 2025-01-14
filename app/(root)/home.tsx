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
  ScrollView,Platform,
  RefreshControl,
} from "react-native";
import { getMicrophonePermission } from "@/utils/permissionsUtils";
import axios from "axios";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Mic, Plus } from "lucide-react-native";
import { router } from "expo-router";
import { Audio } from "expo-av";
import { ACCUWEATHER_API_KEY } from "@/api";
import { images } from "@/constants";
import fetchCityWeatherInfo from "@/utils/getWeatherByCord";
import fetchWeatherByCityKey from "@/utils/getWeatherByCityKey";
import City from "@/utils/model/city";
import { WeatherForecast, WeatherInfo } from "@/types/type";
import { prompt_assistant } from "@/utils/prompt";
import { Buffer } from 'buffer';

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
  const [citiesWeather, setCitiesWeather] = useState<(WeatherInfo | null)[]>(
    [],
  );
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistext, setAssistext] = useState<string>("");
  const [assisreply, setAssisreply] = useState(false);
  const [assisloading, setAssisloading] = useState(false);
  const [assisVoiceloading, setAssisVoiceloading] = useState("....thinking");

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
        `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${city.key}?apikey=${ACCUWEATHER_API_KEY}&metric=true`,
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
        day: new Date(forecast.Date).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        high: Math.round(forecast.Temperature.Maximum.Value),
        low: Math.round(forecast.Temperature.Minimum.Value),
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
        `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`
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
            };
          } else if (city.latitude !== null && city.longitude !== null) {
            const weatherInfo = await fetchCityWeatherInfo(
              city.latitude,
              city.longitude,
              ACCUWEATHER_API_KEY
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
        })
      );

      // Convert array of forecasts to object with city keys
      const forecastObject = forecasts.reduce((acc, curr) => {
        if (curr.key && curr.data) {
          acc[curr.key] = curr.data;
        }
        return acc;
      }, {} as { [key: string]: WeatherForecast[] });

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
      Alert.alert("Permission Required", "Microphone permission is required to record audio.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

   // const newRecording = new Audio.Recording();
    //await newRecording.prepareToRecordAsync(recordingOptions);
    //await newRecording.startAsync();
    const { recording } = await Audio.Recording.createAsync(recordingOptions);
    setIsRecording(true);
    setRecording(recording);
    //setRecording(newRecording);
   // setIsRecording(true);
    
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
      //setRecording(null);

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
    setAssisVoiceloading("....getting there");
    console.log("Starting audio upload with URI:", uri);

    const formData = new FormData();
    formData.append("file", {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      type: "audio/mp3",
      name: "recording.mp3"
    } as any);

    const transcriptionResponse = await axios.post(
      "https://7e58-196-119-60-6.ngrok-free.app/transcribe",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
      }
    );

    const transcript = transcriptionResponse.data.transcriptions[0]?.transcript;
    console.log("Transcription:", transcript);

    const assistantResponseText = await sendToGemini(prompt_assistant, transcript);

    // Update assistant reply state
    setAssistext(assistantResponseText);
    setAssisreply(true);

    // Initiate text-to-speech conversion and playback
    await playAssistantResponse(assistantResponseText);

  } catch (error) {
    console.error("Error uploading recording:", error);
    Alert.alert("Error", "Failed to upload recording. Please try again.");
  } finally {
    setAssisloading(false);
  }
};
const playAssistantResponse = async (text: string) => {
  try {
    const responseAudio = await axios.post(
      "https://api.play.ht/api/v2/tts/stream",
      {
        text,
        voice_engine: "PlayDialog",
        voice: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
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
      }
    );

    const base64Audio = `data:audio/mp3;base64,${Buffer.from(responseAudio.data).toString('base64')}`;
    const soundObject = new Audio.Sound();
    await soundObject.loadAsync({ uri: base64Audio });
    await soundObject.playAsync();

  } catch (error) {
    console.error("Error during audio playback:", error);
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

  
  const renderWeatherPage = (weatherInfo: WeatherInfo | null) => (
    <View style={styles.weatherContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : weatherInfo ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.weatherContent}>
            {/* Main Weather Information */}
            <Text style={styles.cityText}>{weatherInfo.name}</Text>
            <Text style={styles.countryText}>{weatherInfo.country}</Text>
            <Text style={styles.tempText}>{`${Math.trunc(weatherInfo.temperature!)}°C`}</Text>
            <Text style={styles.weatherText}>{weatherInfo.weatherText}</Text>

            {/* Current Conditions Card */}
            <View style={styles.currentConditionsCard}>
              <Text style={styles.sectionTitle}>Current Conditions</Text>
              <View style={styles.conditionsGrid}>
                <View style={styles.conditionItem}>
                  <Text style={styles.conditionLabel}>Wind Speed</Text>
                  <Text style={styles.conditionValue}>{weatherInfo.windSpeed} km/h</Text>
                </View>
                <View style={styles.conditionItem}>
                  <Text style={styles.conditionLabel}>Humidity</Text>
                  <Text style={styles.conditionValue}>{weatherInfo.humidity}%</Text>
                </View>
                <View style={styles.conditionItem}>
                  <Text style={styles.conditionLabel}>Real Feel</Text>
                  <Text style={styles.conditionValue}>{weatherInfo.realFeel}°C</Text>
                </View>
                <View style={styles.conditionItem}>
                  <Text style={styles.conditionLabel}>UV Index</Text>
                  <Text style={styles.conditionValue}>{weatherInfo.uvIndex}</Text>
                </View>
              </View>
            </View>

            {/* 5-Day Forecast */}
            <View style={styles.forecastCard}>
              <Text style={styles.sectionTitle}>5-Day Forecast</Text>
              {weatherInfo.key && forecast[weatherInfo.key] ? (
                forecast[weatherInfo.key].map((item, index) => (
                  <View key={index} style={styles.forecastRow}>
                    <Text style={styles.forecastDay}>{item.day}</Text>
                    <Text style={styles.forecastTemp}>{`${item.high}°/${item.low}°`}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.errorText}>No forecast available</Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.errorText}>No weather data available</Text>
      )}
    </View>
  );
  
const getClothsFromApi =async(prompt_user:string)=>{
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_API_KEY = "AIzaSyCcWWbB0FzPrZqeehhZPfzITbBLWYXcycY"; 
const final_promot=prompt_assistant+prompt_user;
const formdata= new FormData();
formdata.append("",final_promot);
  const assistant_text_response=await axios.post(GEMINI_API_URL,
    
  )

} 
/// we could send the primary city with the prompt
async function sendToGemini(prompt: string, userText: string): Promise<string> {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  const GEMINI_API_KEY = 'AIzaSyCcWWbB0FzPrZqeehhZPfzITbBLWYXcycY'; // Replace with your actual API key.

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: `${prompt} ${userText}` },
        ],
      },
    ],
  };

  try {
    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    setAssisloading(true);
    if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      setAssisreply(true);
      console.log("inside gem",response.data.candidates?.[0]?.content.parts[0].text);
      setAssisVoiceloading(response.data.candidates?.[0]?.content.parts[0].text);
      return response.data.candidates?.[0]?.content.parts[0].text;
    } else {
      throw new Error('No content generated by Gemini API');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Gemini API Error:', error.response.data);
      throw new Error(`Gemini API Error: ${error.response.statusText}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}
 return (
  <SafeAreaProvider>
  <ImageBackground
    source={images.morning}
    style={styles.container}
    resizeMode="cover"
  >
    <TouchableOpacity
      style={styles.plusButton}
      onPress={() => router.push("/(root)/manageCities")}
    >
      <Plus size={44} color="white" />
    </TouchableOpacity>

    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refresh} onRefresh={handleRefresh} />
      }
    >
      <Swiper
        loop={false}
        showsPagination={true}
        paginationStyle={styles.pagination}
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

      {assisloading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Waiting for assistant's response...</Text>
        </View>
      ) : assisreply ? (
        <Text style={styles.transcriptText}> {assistext}</Text>
      ) : null}

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

      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
   // Main Container Styles
   container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
  },
  weatherContainer: {
    flex: 1,
    minHeight: '100%',
  },
  weatherContent: {
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: 20,
  },

  // Header Information Styles
  cityText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  countryText: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tempText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  weatherText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginVertical: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Current Conditions Card Styles
  currentConditionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    width: '90%',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conditionItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  conditionValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },

  // Forecast Card Styles
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    width: '90%',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  forecastDay: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  forecastTemp: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Navigation and Control Styles
  plusButton: {
    position: "absolute",
    top: 30,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 22,
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
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noDataText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
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
