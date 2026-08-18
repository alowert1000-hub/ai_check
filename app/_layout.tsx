import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSettingsStore } from "@/src/store/useSettingsStore";

export default function RootLayout() {
  const loadSecrets = useSettingsStore((s) => s.loadSecrets);

  useEffect(() => {
    loadSecrets();
  }, [loadSecrets]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFF6F0" }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFF6F0" },
          animation: "fade",
        }}
      />
    </GestureHandlerRootView>
  );
}
