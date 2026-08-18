import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

async function readSecret(key: string): Promise<string> {
  if (Platform.OS === "web") {
    return (await AsyncStorage.getItem(key)) ?? "";
  }
  try {
    return (await SecureStore.getItemAsync(key)) ?? "";
  } catch {
    return (await AsyncStorage.getItem(key)) ?? "";
  }
}

async function writeSecret(key: string, value: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

type SettingsState = {
  apiKey: string;
  model: string;
  hydratedSecrets: boolean;
  setApiKey: (key: string) => Promise<void>;
  setModel: (model: string) => void;
  loadSecrets: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: process.env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",
      hydratedSecrets: false,
      setApiKey: async (key) => {
        await writeSecret("openai_api_key", key.trim());
        set({ apiKey: key.trim() });
      },
      setModel: (model) => set({ model }),
      loadSecrets: async () => {
        const fromEnv = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
        const stored = await readSecret("openai_api_key");
        set({ apiKey: stored || fromEnv, hydratedSecrets: true });
      },
    }),
    {
      name: "aicheck-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ model: s.model }),
    }
  )
);
