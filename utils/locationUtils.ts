import * as Location from "expo-location";

import UserLocation from "./model/UserLocation";

const getCurrentLocation = async () => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const currentLocation = new UserLocation(coords.latitude, coords.longitude);

    console.log(`Current Location latitude: ${currentLocation.getLatitude()}`);
    console.log(
      `Current Location longitude: ${currentLocation.getLongitude()}`,
    );

    return currentLocation;
  } catch (e) {
    console.error("Location Error:", e);
    return null;
  }
};

export { getCurrentLocation };
