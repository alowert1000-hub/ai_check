import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SCREEN_FILL } from "@/src/constants/layout";
import { useSettingsStore } from "@/src/store/useSettingsStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const loadSecrets = useSettingsStore((s) => s.loadSecrets);

  useEffect(() => {
    loadSecrets();
    SplashScreen.hideAsync().catch(() => {});
  }, [loadSecrets]);

  return (
    <GestureHandlerRootView style={SCREEN_FILL}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: SCREEN_FILL,
          animation: "none",
        }}
      />
    </GestureHandlerRootView>
  );
}
