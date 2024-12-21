import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { requestLocationPermission } from "@/utils/permissionsUtils";
import { getCurrentLocation } from "@/utils/locationUtils";
import UserLocation from "@/utils/model/UserLocation";
import { saveLocationToAsyncStorage } from "@/utils/storageUtils";

const HomeScreen = () => {
  const [firstColor, setFirstColor] = useState<string>("#456bee");
  const [secondColor, setSecondColor] = useState<string>("#f0f8ff");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const hasPermission = await requestLocationPermission();

        if (hasPermission) {
          const currentLocation = await getCurrentLocation();

          if (currentLocation) {
            setLocation(currentLocation);
            setError(null);

            await saveLocationToAsyncStorage(currentLocation);
          } else {
            console.error("Location Error:", error);
            setLocation(null);
            setError("Failed to fetch location.");
          }
        }
      } catch (e) {
        setError("An expected error has occurred.");
      }
    };

    fetchLocation();
  }, []);

  return (
    <SafeAreaProvider>
      <LinearGradient colors={[firstColor, secondColor]} className="flex-1">
        <SafeAreaView>
          <TouchableOpacity
            className="mt-10 flex-row-reverse justify-start"
            onPress={() => null}
          >
            <Plus size={44} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

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
        </View>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

export default HomeScreen;
