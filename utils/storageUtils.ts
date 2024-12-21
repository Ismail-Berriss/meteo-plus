import AsyncStorage from "@react-native-async-storage/async-storage";

import UserLocation from "./model/UserLocation";

const saveLocationToAsyncStorage = async (location: UserLocation) => {
  try {
    await AsyncStorage.setItem("userLocation", JSON.stringify(location));

    console.log("Location saved to Async Storage");
  } catch (e) {
    console.error(`Async storage error: ${e}`);
  }
};

export { saveLocationToAsyncStorage };
