import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheeringModal } from "@/src/components/CheeringModal";
import { InstallBanner } from "@/src/components/InstallBanner";
import { GAMES, getGame } from "@/src/constants/games";
import { SCREEN_FILL } from "@/src/constants/layout";
import { useCheeringModal } from "@/src/hooks/useCheeringModal";
import { useLayout } from "@/src/hooks/useLayout";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { GameId } from "@/src/types/game";

export default function HomeScreen() {
  const router = useRouter();
  const { columns, contentMax, isTablet } = useLayout();
  const cheer = useCheeringModal();
  const history = useSessionStore((s) => s.history);
  const lastByGame = useMemo(() => {
    const map: Partial<Record<GameId, number>> = {};
    history.forEach((h) => {
      if (map[h.gameId] == null) map[h.gameId] = h.accuracy;
    });
    return map;
  }, [history]);

  return (
    <SafeAreaView className="flex-1 bg-cream" style={SCREEN_FILL}>
      <ScrollView
        className="flex-1"
        style={SCREEN_FILL}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          maxWidth: contentMax,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <View className="flex-row items-start justify-between mt-2">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-rose-500">AI 역량검사 전략게임</Text>
            <Text className="text-3xl font-bold text-ink mt-1">
              오늘도 연습하러{isTablet ? " " : "\n"}왔구나 💛
            </Text>
            <Text className="text-muted mt-2 leading-5">
              게임 과제 9종을 반복 연습하고 세트마다 AI 코칭을 받아보세요. 카드의 방법·팁에서 규칙과
              공략을 먼저 확인하면 좋아요.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            className="rounded-2xl bg-white px-3 py-3"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-lg">⚙️</Text>
          </Pressable>
        </View>

        <InstallBanner />

        {history[0] ? (
          <View
            className="mt-5 rounded-3xl bg-white px-4 py-3"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-xs text-muted">최근 연습</Text>
            <Text className="text-ink font-bold mt-1">
              {history[0].gameTitle} {history[0].accuracy}% · {history[0].avgReactionMs}ms
            </Text>
          </View>
        ) : null}

        <View className="flex-row flex-wrap mt-5" style={{ marginHorizontal: -6 }}>
          {GAMES.map((game) => (
            <View key={game.id} style={{ width: `${100 / columns}%`, padding: 6 }}>
              <View
                className="rounded-3xl p-4"
                style={{ backgroundColor: game.tint, minHeight: isTablet ? 196 : 190 }}
              >
                <Pressable onPress={() => cheer.openFor(game.id)}>
                  <Text className="text-3xl">{game.emoji}</Text>
                  <Text className="text-lg font-bold text-ink mt-2">{game.title}</Text>
                  <Text className="text-xs text-muted mt-1" numberOfLines={2}>
                    {game.subtitle}
                  </Text>
                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-xs font-semibold" style={{ color: game.accent }}>
                      {"●".repeat(game.difficulty)}
                      <Text className="text-muted">{"○".repeat(5 - game.difficulty)}</Text>
                    </Text>
                    {lastByGame[game.id] != null ? (
                      <Text className="text-xs text-muted">{lastByGame[game.id]}%</Text>
                    ) : (
                      <Text className="text-xs text-muted">{game.durationLabel}</Text>
                    )}
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: "/guide/[id]", params: { id: game.id } })}
                  className="mt-3 rounded-2xl bg-white py-2 items-center"
                  style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
                >
                  <Text className="text-xs font-bold text-ink">방법 · 팁 보기</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <CheeringModal
        visible={cheer.visible}
        message={cheer.message}
        gameTitle={cheer.pendingId ? getGame(cheer.pendingId)?.title : undefined}
        onCancel={cheer.close}
        onStart={() => {
          const id = cheer.pendingId;
          cheer.close();
          if (id) router.push({ pathname: "/games/[id]", params: { id } });
        }}
      />
    </SafeAreaView>
  );
}
