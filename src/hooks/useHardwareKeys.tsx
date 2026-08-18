import { useEffect, useRef } from "react";
import { Platform, TextInput } from "react-native";

export function normalizeKey(key: string): string {
  if (key === "Left" || key === "LeftArrow" || key === "UIKeyInputLeftArrow") return "ArrowLeft";
  if (key === "Right" || key === "RightArrow" || key === "UIKeyInputRightArrow") return "ArrowRight";
  if (key === "Down" || key === "DownArrow" || key === "UIKeyInputDownArrow") return "ArrowDown";
  if (key === "Up" || key === "UpArrow" || key === "UIKeyInputUpArrow") return "ArrowUp";
  if (key === "Spacebar" || key === "Space") return " ";
  return key;
}

export function HardwareKeySink({
  active,
  onKey,
}: {
  active: boolean;
  onKey: (key: string) => void;
}) {
  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const fn = (e: KeyboardEvent) => {
      const k = normalizeKey(e.key);
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(k)) {
        e.preventDefault();
        onKeyRef.current(k);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [active]);

  if (!active || Platform.OS === "web") return null;

  return (
    <TextInput
      autoFocus
      showSoftInputOnFocus={false}
      caretHidden
      style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
      onKeyPress={(e) => onKeyRef.current(normalizeKey(e.nativeEvent.key))}
    />
  );
}
