import { Text, View } from "react-native";
import type { GlyphId } from "@/src/games/logic/nback";

type Props = {
  id: GlyphId;
  size?: number;
  color?: string;
};

export function Glyph({ id, size = 92, color = "#7C5CBF" }: Props) {
  if (id === "circle") {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    );
  }
  if (id === "square") {
    return (
      <View
        style={{
          width: size * 0.86,
          height: size * 0.86,
          borderRadius: 10,
          backgroundColor: color,
        }}
      />
    );
  }
  if (id === "diamond") {
    return (
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          backgroundColor: color,
          borderRadius: 8,
          transform: [{ rotate: "45deg" }],
        }}
      />
    );
  }
  if (id === "triangle") {
    return (
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.48,
          borderRightWidth: size * 0.48,
          borderBottomWidth: size * 0.82,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
    );
  }
  if (id === "star") {
    return <Text style={{ fontSize: size * 0.92, lineHeight: size }}>⭐</Text>;
  }
  return (
    <View
      style={{
        width: size * 0.86,
        height: size * 0.72,
        backgroundColor: color,
        borderRadius: size * 0.22,
      }}
    />
  );
}
