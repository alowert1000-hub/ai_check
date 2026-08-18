import { Stack } from "expo-router";
import { SCREEN_FILL } from "@/src/constants/layout";

export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: SCREEN_FILL,
        animation: "none",
      }}
    />
  );
}
