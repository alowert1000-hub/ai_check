import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { getGame } from "@/src/constants/games";
import { SCREEN_FILL } from "@/src/constants/layout";
import { useLayout } from "@/src/hooks/useLayout";
import { COMPETENCY_META } from "@/src/utils/competency";

export default function GuideScreen() {
  const router = useRouter();
  const { contentMax } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meta = getGame(id);

  if (!meta) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-6" style={SCREEN_FILL}>
        <Text className="font-bold text-ink">가이드를 찾지 못했어요</Text>
        <Pressable onPress={() => router.replace("/")} className="mt-3">
          <Text className="font-semibold text-ink">홈으로</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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
        <Pressable
          onPress={() => router.back()}
          className="self-start rounded-full bg-white px-3 py-2 mb-4"
          style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
        >
          <Text className="font-semibold text-ink">← 뒤로</Text>
        </Pressable>

        <View className="rounded-3xl p-5" style={{ backgroundColor: meta.tint }}>
          <Text className="text-4xl">{meta.emoji}</Text>
          <Text className="text-2xl font-bold text-ink mt-2">{meta.title}</Text>
          <Text className="text-[15px] leading-6 text-ink mt-2">{meta.summary}</Text>
        </View>

        <View className="flex-row gap-2 mt-3">
          <InfoCard label="평가 영역" value={meta.evalArea} />
          <InfoCard label="소요 시간" value={meta.durationLabel} />
          <InfoCard label="사용 도구" value={meta.tool} />
        </View>
        <View className="mt-2 rounded-3xl bg-white p-4">
          <Text className="text-xs text-muted leading-5">{meta.evalDesc}</Text>
          <Text className="text-xs mt-2 font-semibold" style={{ color: meta.accent }}>
            {COMPETENCY_META[meta.competency].label} · {meta.skill}
          </Text>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-5">
          <Text className="text-lg font-bold text-ink">게임 방법</Text>
          {meta.methods.map((line) => (
            <Text key={line} className="text-[15px] leading-6 text-ink mt-3">
              • {line}
            </Text>
          ))}
        </View>

        <View
          className="mt-4 rounded-3xl p-5"
          style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }}
        >
          <Text className="text-lg font-bold text-ink">공략 TIP</Text>
          {meta.tips.map((line) => (
            <Text key={line} className="text-[15px] leading-6 text-ink mt-3">
              • {line}
            </Text>
          ))}
        </View>

        <View className="mt-5">
          <PrimaryButton
            label={`${meta.title} 연습하기`}
            onPress={() => router.replace({ pathname: "/games/[id]", params: { id: meta.id } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-3">
      <Text className="text-[11px] text-muted">{label}</Text>
      <Text className="text-sm font-bold text-ink mt-1">{value}</Text>
    </View>
  );
}
