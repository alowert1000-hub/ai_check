import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export async function buzzOk() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}

export async function buzzBad() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* ignore */
  }
}

export async function buzzLight() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* ignore */
  }
}
