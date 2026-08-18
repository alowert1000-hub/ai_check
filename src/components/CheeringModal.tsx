import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PrimaryButton } from "@/src/components/PrimaryButton";

type Props = {
  visible: boolean;
  message: string;
  gameTitle?: string;
  onStart: () => void;
  onCancel: () => void;
};

export function CheeringModal({ visible, message, gameTitle, onStart, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(61,44,46,0.46)" }}>
        <Animated.View
          entering={FadeInDown.duration(380)}
          className="w-full max-w-md rounded-3xl bg-white px-6 py-7"
        >
          <Animated.Text entering={FadeIn.delay(80)} className="text-center text-4xl">
            💌
          </Animated.Text>
          <Text className="mt-3 text-center text-sm font-semibold text-rose-400">
            {gameTitle ? `${gameTitle} 시작 전` : "응원 한 스푼"}
          </Text>
          <Text className="mt-3 text-center text-[18px] leading-7 font-bold text-ink">
            {message}
          </Text>
          <View className="mt-6">
            <PrimaryButton label="응원 받고 시작하기" onPress={onStart} />
          </View>
          <Pressable onPress={onCancel} className="mt-3 py-2">
            <Text className="text-center text-sm text-muted">조금 뒤에 할래</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
