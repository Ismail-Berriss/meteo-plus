import React, { useRef, useState } from "react";
import { Image, View, Text, ImageBackground } from "react-native";
import Swiper from "react-native-swiper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { images, onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";
import {
  requestLocationPermission,
  checkLocationServices,
} from "@/utils/permissionsUtils";
import { getCurrentLocation } from "@/utils/locationUtils";
import { saveLocationToAsyncStorage } from "@/utils/storageUtils";
import UserLocation from "@/utils/model/UserLocation";

const OnboardingScreen = () => {
  const setFirstUseTrue = () => {
    AsyncStorage.setItem("first-use", "true");
  };

  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLocationActive, setLocationActive] = useState<boolean>(false);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const handleLocationRequest = async () => {
    try {
      // Request location permission
      const isPermissionGranted = await requestLocationPermission();
      setHasPermission(isPermissionGranted);

      // Check if GPS is enabled
      const isGpsEnabled: boolean = await checkLocationServices();
      setLocationActive(isGpsEnabled);

      // Fetch current location if permission granted & location is enabled
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        await saveLocationToAsyncStorage(currentLocation);
        setError(null);
        console.log("Location saved:", currentLocation);
      } else {
        setError("Failed to fetch location.");
      }
    } catch (e) {
      console.error("Unexpected error in handleLocationRequest:", e);
      setError("An unexpected error occurred while processing location.");
    }
  };

  return (
    <SafeAreaProvider>
      {/* <LinearGradient colors={["#456bee", "#f0f8ff"]} className="flex-1"> */}
      <ImageBackground source={images.morning} resizeMode="cover">
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
                  className="w-full h-[250px] mb-10"
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
              title={
                hasPermission
                  ? isLocationActive
                    ? "Location Fetched"
                    : "Enable Location"
                  : "Grant Location Permission"
              }
              bgVariant={
                hasPermission && isLocationActive ? "success" : "danger"
              }
              onPress={handleLocationRequest}
              className="w-11/12 mt-10 mb-1"
              disabled={hasPermission && isLocationActive ? true : false}
            />
          )}

          <CustomButton
            title={isLastSlide ? "Get Started" : "Next"}
            onPress={() => {
              setFirstUseTrue();
              if (isLastSlide) {
                if (hasPermission) {
                  router.replace("/(root)/home");
                } else {
                  router.replace("/(root)/add-city");
                }
              } else {
                swiperRef.current?.scrollBy(1);
              }
            }}
            className="w-11/12 mt-5 mb-5"
          />
        </SafeAreaView>
        {/* </LinearGradient> */}
      </ImageBackground>
    </SafeAreaProvider>
  );
};

export default OnboardingScreen;
