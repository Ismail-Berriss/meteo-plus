import { Platform } from "react-native";
import * as Location from "expo-location";

const requestLocationPermission = async () => {
  if (Platform.OS === "android") {
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log(`Location Permission: ${status}`);

    return status === "granted";
  } else {
    return true;
  }
};

export { requestLocationPermission };
