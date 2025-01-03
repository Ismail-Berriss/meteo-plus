
// Permissions Utilities
import * as Location from "expo-location";
import { Audio } from "expo-av";
import { Alert, Platform } from "react-native";
const checkLocationServices = async () => {
  const isEnabled = await Location.hasServicesEnabledAsync();

  if (!isEnabled) {
    return new Promise((resolve) => {
      Alert.alert(
        "Enable Location Services",
        "Location services are disabled. Please enable them in your device settings to continue.",
        [
          {
            text: "Go to Settings",
            onPress: async () => {
              try {
                await Location.enableNetworkProviderAsync();
                resolve(true);
              } catch (error) {
                console.error("Error enabling location services:", error);
                Alert.alert("Error", "Unable to open location settings.");
                resolve(false);
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
        ]
      );
    });
  }

  return true;
};

const getMicrophonePermission = async () => {
  try {
    const { granted } = await Audio.requestPermissionsAsync();

    if (!granted) {
      Alert.alert(
        "Permission",
        "Please grant permission to access microphone"
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const requestLocationPermission = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === "granted") {
      console.log("Location permission already granted.");
      return true;
    }

    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

    if (newStatus === "granted") {
      console.log("Location permission granted.");
      return true;
    } else {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to access this feature. Please allow it in your settings."
      );
      return false;
    }
  } catch (error) {
    console.error("Error requesting location permission:", error);
    Alert.alert(
      "Error",
      "An unexpected error occurred while requesting location permission. Please try again."
    );
    return false;
  }
};

export { requestLocationPermission, checkLocationServices,getMicrophonePermission };
