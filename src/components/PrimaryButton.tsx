import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "success";
};

const BG: Record<NonNullable<Props["variant"]>, string> = {
  primary: "#1F2937",
  ghost: "#FFFFFF",
  danger: "#B91C1C",
  success: "#047857",
};

export function PrimaryButton({ label, onPress, disabled, variant = "primary" }: Props) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-2xl px-5 py-4 items-center ${disabled ? "opacity-40" : "active:opacity-80"}`}
      style={{
        backgroundColor: BG[variant],
        borderWidth: isGhost ? 1.5 : 0,
        borderColor: "#D8CFCB",
        shadowColor: "#3D2C2E",
        shadowOpacity: isGhost ? 0.05 : 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <Text className="text-base font-bold" style={{ color: isGhost ? "#3D2C2E" : "#FFFFFF" }}>
        {label}
      </Text>
    </Pressable>
  );
}
