import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Mic, Plus } from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const HomeScreen = () => {
  const [firstColor, setFirstColor] = useState<string>("#456bee");
  const [secondColor, setSecondColor] = useState<string>("#f0f8ff");
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleMicrophonePress = () => {
    setModalVisible(true); // Open the modal when the mic button is pressed
    setTimeout(() => {
      setIsListening(true); // Simulate the app "listening" after a short delay
    }, 1500);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setIsListening(false); // Reset listening state
  };

  const handleCloseModal = () => {
    setModalVisible(false); // Close the modal
    setIsListening(false); // Reset listening state
  };

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={[firstColor, secondColor]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => router.push("/(root)/add-city")}
          >
            <Plus size={44} color="white" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-start pt-36">
            <Text className="text-4xl font-bold text-white p-2">Agadir</Text>
            <Text className="text-2xl text-white">°C</Text>
          </View>

          <View className="#f1f5f9">
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Monday</Text>
              <Text className="text-white text-3xl">24°/12°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Tuesday</Text>
              <Text className="text-white text-3xl">22°/10°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
            <View className="flex-row justify-between items-center px-4 py-2 rounded-md">
              <Text className="text-white text-3xl">Wednesday</Text>
              <Text className="text-white text-3xl">26°/15°</Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Circle with Microphone */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleMicrophonePress}
        >
          <Mic size={28} color="white" />
        </TouchableOpacity>

        {/* Modal for Voice Input */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Display Mic Icon */}
              <Mic size={48} color="#007AFF" />

              {/* Listening Text */}
              {isListening ? (
                <Text style={styles.listeningText}>I'm listening...</Text>
              ) : (
                <Text style={styles.modalDescription}>
                  Tap the mic and start talking!
                </Text>
              )}

              {/* Loading Indicator */}
              {isListening && (
                <ActivityIndicator
                  size="large"
                  color="#007AFF"
                  style={{ marginTop: 20 }}
                />
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
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
  text: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plusButton: {
    position: "absolute",
    top: 30,
    right: 20,
  },
  micButton: {
    position: "fixed",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF", // Blue color
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
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
