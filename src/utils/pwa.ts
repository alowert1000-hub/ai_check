import { Platform } from "react-native";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function webWindow(): (Window & { navigator: NavigatorWithStandalone }) | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return window;
}

/** iPhone + iPad (iPadOS는 Macintosh로 위장하는 경우가 있음) */
export function isAppleTouchDevice() {
  const win = webWindow();
  if (!win) return false;
  const ua = win.navigator.userAgent;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  return win.navigator.platform === "MacIntel" && win.navigator.maxTouchPoints > 1;
}

export function isStandaloneApp() {
  if (Platform.OS !== "web") return true;
  const win = webWindow();
  if (!win) return false;
  const standalone = win.navigator.standalone === true;
  const displayMode = win.matchMedia?.("(display-mode: standalone)")?.matches;
  const fullscreen = win.matchMedia?.("(display-mode: fullscreen)")?.matches;
  return Boolean(standalone || displayMode || fullscreen);
}

export function shouldPromptHomeScreenInstall() {
  return Platform.OS === "web" && isAppleTouchDevice() && !isStandaloneApp();
}
