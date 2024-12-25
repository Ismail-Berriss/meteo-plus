import { Alert, Platform } from "react-native";
import * as Location from "expo-location";

const checkLocationServices = async () => {
  const isEnabled = await Location.hasServicesEnabledAsync();
  if (isEnabled) {
    return true;
  } else {
    Alert.alert(
      "Enable Location Services",
      "Please enable location services in your device settings to proceed.",
      [
        {
          text: "Go to Settings",
          onPress: () => {
            Location.enableNetworkProviderAsync();
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
    return false;
  }
};

const requestLocationPermission = async () => {
  try {
    const servicesEnabled = await checkLocationServices();
    if (!servicesEnabled) return false;

    // Check current permission status
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === "granted") {
      Alert.alert(
        "Permission Granted",
        "You already have location permissions!",
      );
      return true;
    }

    // Request permissions is not already granted
    const { status: newStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (newStatus === "granted") {
      Alert.alert(
        "Permission Granted",
        "Location permission has been granted!",
      );
      return true;
    } else {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to access this feature.",
      );
      return false;
    }
  } catch (e) {
    console.error("Error requesting location permission:", e);
    Alert.alert(
      "Error",
      "An error occurred while requesting location permission.",
    );
    return false;
  }
};

export { requestLocationPermission };
