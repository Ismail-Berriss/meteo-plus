import React, { useEffect, useRef, useState } from "react";
import { Image, View, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { requestLocationPermission } from "@/utils/permissionsUtils";
import { getCurrentLocation } from "@/utils/locationUtils";
import { saveLocationToAsyncStorage } from "@/utils/storageUtils";
import UserLocation from "@/utils/model/UserLocation";

const OnboardingScreen = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const fetchLocation = async () => {
    try {
      const isPermited = await requestLocationPermission();
      setHasPermission(isPermited);

      console.log(`Location Permission: ${hasPermission}`);
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

  return (
    <SafeAreaProvider>
      <LinearGradient colors={["#456bee", "#f0f8ff"]} className="flex-1">
        <SafeAreaView className="flex h-full items-center justify-between">
          <Swiper
            ref={swiperRef}
            loop={false}
            dot={
              <View className="w-[32px] h-[4px] mx-1 bg-[#e2e8f0] rounded-full" />
            }
            activeDot={
              <View className="w-[32px] h-[4px] mx-1 bg-[#0286ff] rounded-full" />
            }
            onIndexChanged={(index) => setActiveIndex(index)}
          >
            {onboarding.map((item) => (
              <View
                key={item.id}
                className="flex items-center justify-center p-5"
              >
                <Image
                  source={item.image}
                  className="w-full h-[300px]"
                  resizeMode="contain"
                />

                <View className="flex flex-row items-center justify-center w-full mt-10">
                  <Text className="text-black text-3xl font-bold mx-10 text-center p-1">
                    {item.title}
                  </Text>
                </View>
                <Text className="text-md text-center text-[#858585] mx-10 mt-3">
                  {item.description}
                </Text>
              </View>
            ))}
          </Swiper>

          {activeIndex === 2 && (
            <CustomButton
              title="Enable Location"
              bgVariant="secondary"
              onPress={fetchLocation}
              className="w-11/12 mt-10 mb-1"
            />
          )}

          <CustomButton
            title={isLastSlide ? "Get Started" : "Next"}
            onPress={() =>
              isLastSlide
                ? hasPermission
                  ? router.replace("/(root)/home")
                  : router.replace("/(root)/add-city")
                : swiperRef.current?.scrollBy(1)
            }
            className="w-11/12 mt-5 mb-5"
          />
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;
