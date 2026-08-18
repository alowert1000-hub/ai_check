import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { getGame } from "@/src/constants/games";
import { SCREEN_FILL } from "@/src/constants/layout";
import { useLayout } from "@/src/hooks/useLayout";
import { useSessionStore } from "@/src/store/useSessionStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { COMPETENCY_META } from "@/src/utils/competency";
import { fetchAiFeedback } from "@/src/utils/openai";
import type { CompetencyKey } from "@/src/types/game";

export default function ResultScreen() {
  const router = useRouter();
  const { contentMax } = useLayout();
  const last = useSessionStore((s) => s.lastResult);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const model = useSettingsStore((s) => s.model);
  const [feedback, setFeedback] = useState("");
  const [source, setSource] = useState<"openai" | "local" | "loading">("loading");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!last) return;
    let alive = true;
    setSource("loading");
    fetchAiFeedback(last, apiKey, model).then((res) => {
      if (!alive) return;
      setFeedback(res.text);
      setSource(res.source);
      setError(res.error);
    });
    return () => {
      alive = false;
    };
  }, [last, apiKey, model]);

  if (!last) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-6" style={SCREEN_FILL}>
        <Text className="text-ink font-bold">아직 결과가 없어요</Text>
        <Pressable onPress={() => router.replace("/")} className="mt-4">
          <Text className="font-semibold text-ink">홈으로</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const meta = getGame(last.gameId);
  const seconds = Math.round((last.finishedAt - last.startedAt) / 1000);
  const learningDelta = Number(last.extra.learningDelta ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-cream" style={SCREEN_FILL}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          maxWidth: contentMax,
          width: "100%",
          alignSelf: "center",
          paddingBottom: 40,
        }}
      >
        <Text className="text-center text-5xl">{meta?.emoji ?? "🎉"}</Text>
        <Text className="text-center text-2xl font-bold text-ink mt-3">한 세트 끝!</Text>
        <Text className="text-center text-muted mt-1">
          {last.gameTitle} · {seconds}초
        </Text>

        <View className="flex-row gap-2 mt-5">
          <Stat label="정답률" value={`${last.accuracy}%`} />
          <Stat label="맞춘 문항" value={`${last.correctCount}/${last.totalTrials}`} />
        </View>
        <View className="flex-row gap-2 mt-2">
          <Stat label="평균 반응" value={`${last.avgReactionMs}ms`} />
          <Stat label="후반 변화" value={`${learningDelta > 0 ? "+" : ""}${learningDelta}%p`} />
        </View>

        {last.competencies ? (
          <View
            className="mt-4 rounded-3xl bg-white p-5"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="font-bold text-ink">4역량 추정치</Text>
            <Text className="text-xs text-muted mt-1">
              백서의 성과·전략·관계·적응 기준을 이 게임 데이터로 환산한 연습용 지표예요.
            </Text>
            <View className="mt-3 gap-3">
              {(Object.keys(COMPETENCY_META) as CompetencyKey[]).map((key) => (
                <CompetencyBar key={key} k={key} value={last.competencies![key]} />
              ))}
            </View>
          </View>
        ) : null}

        {last.errorPatterns.length ? (
          <View
            className="mt-4 rounded-3xl bg-white p-4"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="font-bold text-ink">오답 패턴</Text>
            {last.errorPatterns.map((p) => (
              <Text key={p} className="text-muted mt-1">
                • {p}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="mt-4 rounded-3xl p-5" style={{ backgroundColor: "#EDE4FF" }}>
          <Text className="font-bold text-ink">AI 피드백 및 팁</Text>
          <Text className="text-xs text-muted mt-1">
            {source === "loading"
              ? "코치가 방금 플레이를 읽고 있어요"
              : source === "openai"
                ? `${model} 맞춤 코칭`
                : "로컬 코치 팁 · 설정에서 API 키를 넣으면 생성형 피드백으로 바뀌어요"}
          </Text>
          {source === "loading" ? (
            <ActivityIndicator className="mt-4" color="#9B7EDE" />
          ) : (
            <Text className="mt-3 text-[16px] leading-7 text-ink">{feedback}</Text>
          )}
          {error && source === "local" ? (
            <Text className="text-xs text-muted mt-3">API 호출 실패: {error}</Text>
          ) : null}
        </View>

        {meta ? (
          <Pressable
            onPress={() => router.push({ pathname: "/guide/[id]", params: { id: meta.id } })}
            className="mt-4 rounded-3xl p-4"
            style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }}
          >
            <Text className="font-bold text-ink">{meta.title} 공략 TIP 다시 보기</Text>
            <Text className="text-xs text-muted mt-1">{meta.tips[0]}</Text>
          </Pressable>
        ) : null}

        <View className="mt-5">
          <PrimaryButton
            label="같은 게임 한 세트 더"
            onPress={() => router.replace({ pathname: "/games/[id]", params: { id: last.gameId } })}
          />
        </View>
        <Pressable onPress={() => router.replace("/")} className="mt-3 py-3">
          <Text className="text-center font-semibold text-ink">홈으로 돌아가기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="flex-1 rounded-3xl bg-white p-4"
      style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
    >
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-xl font-bold text-ink mt-1">{value}</Text>
    </View>
  );
}

function CompetencyBar({ k, value }: { k: CompetencyKey; value: number }) {
  const info = COMPETENCY_META[k];
  return (
    <View>
      <View className="flex-row justify-between">
        <Text className="text-sm font-bold text-ink">{info.label}</Text>
        <Text className="text-sm font-bold" style={{ color: info.color }}>
          {value}
        </Text>
      </View>
      <View className="h-2 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
        <View style={{ width: `${value}%`, height: 8, backgroundColor: info.color }} />
      </View>
      <Text className="text-[11px] text-muted mt-1">{info.desc}</Text>
    </View>
  );
}
