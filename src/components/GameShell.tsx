import { ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { SCREEN_FILL } from "@/src/constants/layout";
import { COMPETENCY_META } from "@/src/utils/competency";
import { HardwareKeySink } from "@/src/hooks/useHardwareKeys";
import { useLayout } from "@/src/hooks/useLayout";
import type { PlayFlash } from "@/src/hooks/usePlayFlash";
import type { GameMeta } from "@/src/types/game";

type Props = {
  meta: GameMeta;
  progressLabel?: string;
  children: ReactNode;
  ready: boolean;
  onReady: () => void;
  liveTip?: string;
  flash?: PlayFlash | null;
  onHardwareKey?: (key: string) => void;
};

export function GameShell({
  meta,
  progressLabel,
  children,
  ready,
  onReady,
  liveTip,
  flash,
  onHardwareKey,
}: Props) {
  const router = useRouter();
  const { contentMax } = useLayout();
  const [tipIndex, setTipIndex] = useState(0);
  const [readyTab, setReadyTab] = useState<"method" | "tip">("method");

  useEffect(() => {
    if (!ready || !meta.tips.length) return;
    const id = setInterval(() => setTipIndex((i) => (i + 1) % meta.tips.length), 9000);
    return () => clearInterval(id);
  }, [ready, meta.tips.length]);

  const tip = liveTip ?? meta.tips[tipIndex] ?? meta.tips[0];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "left", "right"]} style={SCREEN_FILL}>
      {onHardwareKey ? <HardwareKeySink active={ready} onKey={onHardwareKey} /> : null}
      <View className="flex-1 self-center w-full px-5" style={{ maxWidth: contentMax }}>
        <View className="flex-row items-center justify-between pt-2 pb-2">
          <Pressable
            onPress={() => router.replace("/")}
            className="rounded-full bg-white px-3 py-2"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-ink font-semibold">← 홈</Text>
          </Pressable>
          <View className="items-center flex-1 px-2">
            <Text className="text-lg font-bold text-ink">
              {meta.emoji} {meta.title}
            </Text>
            {progressLabel ? (
              <Text className="text-xs text-muted mt-0.5">{progressLabel}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/guide/[id]", params: { id: meta.id } })}
            className="rounded-full bg-white px-3 py-2"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-ink font-semibold">방법</Text>
          </Pressable>
        </View>

        {!ready ? (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }}>
            <View className="rounded-3xl p-5" style={{ backgroundColor: meta.tint }}>
              <Text className="text-xl font-bold text-ink">{meta.title}</Text>
              <Text className="mt-2 text-[15px] leading-6 text-ink">{meta.summary}</Text>
              <Text className="mt-3 text-xs text-muted">
                평가 영역 {meta.evalArea} · {meta.durationLabel} · {meta.tool}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {COMPETENCY_META[meta.competency].label} · {meta.skill}
              </Text>

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={() => setReadyTab("method")}
                  className="flex-1 items-center rounded-2xl py-2"
                  style={{
                    backgroundColor: readyTab === "method" ? "#FFFFFF" : "transparent",
                    borderWidth: 1,
                    borderColor: readyTab === "method" ? meta.accent : "transparent",
                  }}
                >
                  <Text className="font-bold text-ink">게임 방법</Text>
                </Pressable>
                <Pressable
                  onPress={() => setReadyTab("tip")}
                  className="flex-1 items-center rounded-2xl py-2"
                  style={{
                    backgroundColor: readyTab === "tip" ? "#FFFFFF" : "transparent",
                    borderWidth: 1,
                    borderColor: readyTab === "tip" ? meta.accent : "transparent",
                  }}
                >
                  <Text className="font-bold text-ink">공략 TIP</Text>
                </Pressable>
              </View>
              <View className="mt-4 gap-3">
                {(readyTab === "method" ? meta.methods : meta.tips).map((line) => (
                  <View key={line} className="flex-row">
                    <Text className="text-base mr-2 text-ink">•</Text>
                    <Text className="flex-1 text-[15px] leading-6 text-ink">{line}</Text>
                  </View>
                ))}
              </View>
              <View className="mt-6">
                <PrimaryButton label="준비됐어, 시작!" onPress={onReady} />
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1">
            {tip ? (
              <View
                className="rounded-2xl px-3 py-2 mb-2"
                style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }}
              >
                <Text className="text-[11px] font-bold" style={{ color: "#9A3412" }}>
                  공략 TIP
                </Text>
                <Text className="text-[13px] leading-5 text-ink mt-0.5">{tip}</Text>
              </View>
            ) : null}
            {flash ? (
              <View
                className="rounded-2xl px-3 py-2 mb-2"
                style={{
                  backgroundColor: flash.kind === "ok" ? "#DCFCE7" : "#FEE2E2",
                  borderWidth: 1,
                  borderColor: flash.kind === "ok" ? "#86EFAC" : "#FCA5A5",
                }}
              >
                <Text
                  className="text-[13px] font-semibold leading-5"
                  style={{ color: flash.kind === "ok" ? "#065F46" : "#991B1B" }}
                >
                  {flash.text}
                </Text>
              </View>
            ) : null}
            <View className="flex-1">{children}</View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
