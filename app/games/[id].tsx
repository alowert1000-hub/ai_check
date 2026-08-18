import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GAME_SCREENS } from "@/src/games";
import { getGame } from "@/src/constants/games";
import type { GameId } from "@/src/types/game";

export default function GameRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meta = getGame(id);
  const Screen = id ? GAME_SCREENS[id as GameId] : undefined;

  if (!Screen || !meta) {
    return (
      <View className="flex-1 items-center justify-center bg-cream px-6">
        <Text className="font-bold text-ink">게임을 찾지 못했어요</Text>
        <Pressable onPress={() => router.replace("/")} className="mt-3">
          <Text className="text-rose-400">홈으로</Text>
        </Pressable>
      </View>
    );
  }

  return <Screen />;
}
