import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

const Page = () => {
  const [isFirstUse, setIsFirstUse] = useState<null | boolean>(null);

  useEffect(() => {
    const checkFirstUse = async () => {
      const value = await AsyncStorage.getItem("first-use");
      setIsFirstUse(value === "true");
      // console.log("is first use:",value);
    };
    checkFirstUse();
  }, []);

  if (isFirstUse === null) {
    // Optional: Render a loading screen or nothing while waiting for AsyncStorage
    return null;
  }

  return (
    <Redirect href={isFirstUse ? "/(root)/onboarding" : "/(root)/onboarding"} />
  );
};

export default Page;
