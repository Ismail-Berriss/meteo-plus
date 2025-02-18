import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const Layout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="add-city" options={{ headerShown: false }} />
        <Stack.Screen name="trans" options={{ headerShown: false }} />


        <Stack.Screen
          name="manageCities"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "Manage Cities",
            headerTintColor: "white",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
};

export default Layout;
