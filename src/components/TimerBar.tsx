import { View } from "react-native";

type Props = {
  ratio: number;
  color?: string;
};

export function TimerBar({ ratio, color = "#F2789F" }: Props) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-white">
      <View
        className="h-2 rounded-full"
        style={{ width: `${clamped * 100}%`, backgroundColor: color }}
      />
    </View>
  );
}
