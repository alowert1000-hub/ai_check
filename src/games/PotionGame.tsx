import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import {
  INGREDIENTS,
  majorityColor,
  makePotionSequence,
  makePotionWorld,
  sampleColor,
  type PotionColor,
  type PotionCombo,
} from "@/src/games/logic/potion";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.potion;
const LENGTH = 28;

export function PotionGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const world = useRef(makePotionWorld()).current;
  const sequence = useRef(makePotionSequence(world, LENGTH)).current;
  const seen = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [choice, setChoice] = useState<PotionColor | null>(null);
  const [outcome, setOutcome] = useState<{ correct: boolean; color: PotionColor } | null>(null);
  const startedAt = useRef(Date.now());
  const beat = useRef(Date.now());
  const lock = useRef(false);
  const flash = usePlayFlash(1800);
  const combo: PotionCombo = sequence[index];

  function predict(picked: PotionColor) {
    if (lock.current) return;
    lock.current = true;
    setChoice(picked);
    const actual = sampleColor(combo);
    const first = !seen.current.has(combo.key);
    seen.current.add(combo.key);
    const correct = picked === actual;
    setOutcome({ correct, color: actual });
    if (correct) buzzOk();
    else buzzBad();
    const colorName = actual === "red" ? "빨간약" : "파란약";
    if (!correct) {
      flash.show({
        kind: "bad",
        text: first
          ? `예측 실패 · 처음 보는 조합은 찍는 게 정상이에요. 이번엔 ${colorName}, 빨간약이면 기억해두세요.`
          : `예측 실패 · 이번엔 ${colorName}. 성공 확률은 100%가 아니라 결과가 달라질 수 있어요.`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      reactionMs: Date.now() - beat.current,
      detail: `${combo.cards.length}장 ${combo.key} → ${picked === "red" ? "빨강" : "파랑"}${first ? " · 신규" : ""}`,
    };
    const next = [...trials, log];

    setTimeout(() => {
      lock.current = false;
      setOutcome(null);
      setChoice(null);
      if (index + 1 >= sequence.length) {
        finish(
          buildPayload({
            gameId: "potion",
            gameTitle: meta.title,
            startedAt: startedAt.current,
            trials: next,
            extra: {
              ingredients: INGREDIENTS.length,
              combos: 14,
              novelErrors: next.filter((t) => !t.correct && t.detail?.includes("신규")).length,
              majorityHint: majorityColor(combo),
            },
          })
        );
        router.replace("/result");
        return;
      }
      setTrials(next);
      setIndex((v) => v + 1);
      beat.current = Date.now();
    }, 1000);
  }

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        beat.current = Date.now();
        setReady(true);
      }}
      progressLabel={
        ready ? `남은 문항 ${sequence.length - index - 1} · 본 조합 ${seen.current.size}/14` : undefined
      }
      liveTip={
        seen.current.size < 8
          ? "초반은 확률 학습 시간! 처음 보는 조합은 파란약부터 고르고, 빨간약이 나온 조합만 기억하세요."
          : "재료 하나가 아니라 조합 전체가 결과를 정해요. 조합끼리는 서로 독립입니다."
      }
      flash={flash.flash}
    >
      <View className="flex-1">
        <Text className="text-center font-bold text-ink mb-3">
          제시되는 재료의 조합으로 어떤 마법약이 제조될지 예측해 보세요
        </Text>

        <View
          className="rounded-3xl bg-white px-4 py-6 items-center"
          style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
        >
          {outcome ? (
            <View className="items-center py-2">
              <View
                className="items-center justify-center rounded-2xl px-10 py-6"
                style={{
                  backgroundColor: outcome.color === "red" ? "#FEE2E2" : "#DBEAFE",
                  borderWidth: 2,
                  borderColor: outcome.color === "red" ? "#F87171" : "#60A5FA",
                }}
              >
                <Text className="text-5xl">{outcome.color === "red" ? "🧪" : "⚗️"}</Text>
              </View>
              <Text
                className="mt-3 text-lg font-bold"
                style={{ color: outcome.correct ? "#047857" : "#B91C1C" }}
              >
                {outcome.correct ? "예측 성공" : "예측 실패"}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {outcome.color === "red" ? "빨간약" : "파란약"}이 제조되었습니다.
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row gap-2">
                {INGREDIENTS.map((ing) => (
                  <Card
                    key={ing.id}
                    emoji={ing.emoji}
                    name={ing.name}
                    faceUp={combo.cards.includes(ing.id)}
                  />
                ))}
              </View>
              <Text className="text-xs text-muted mt-3">
                카드 4장 중 {combo.cards.length}장이 들어간 조합 (전체 14가지)
              </Text>
            </>
          )}
        </View>

        <View className="flex-row gap-3 mt-6">
          <Pressable
            onPress={() => predict("blue")}
            className="flex-1 items-center rounded-3xl py-5 active:opacity-80"
            style={{
              backgroundColor: choice === "blue" ? "#BFDBFE" : "#DBEAFE",
              borderWidth: choice === "blue" ? 3 : 2,
              borderColor: "#2563EB",
            }}
          >
            <Text className="text-lg font-bold" style={{ color: "#1E3A8A" }}>
              파란약
            </Text>
          </Pressable>
          <Pressable
            onPress={() => predict("red")}
            className="flex-1 items-center rounded-3xl py-5 active:opacity-80"
            style={{
              backgroundColor: choice === "red" ? "#FECACA" : "#FEE2E2",
              borderWidth: choice === "red" ? 3 : 2,
              borderColor: "#DC2626",
            }}
          >
            <Text className="text-lg font-bold" style={{ color: "#7F1D1D" }}>
              빨간약
            </Text>
          </Pressable>
        </View>
        <Text className="text-center text-[11px] text-muted mt-2">
          재료를 직접 섞지 않습니다. 제시된 조합을 보고 예측만 하세요.
        </Text>
      </View>
    </GameShell>
  );
}

/** 조합에 들어가는 카드는 앞면, 들어가지 않는 카드는 뒷면으로 제시된다. */
function Card({ emoji, name, faceUp }: { emoji: string; name: string; faceUp: boolean }) {
  if (!faceUp) {
    return (
      <View
        className="items-center justify-center rounded-2xl"
        style={{
          width: 72,
          height: 92,
          backgroundColor: "#4C1D95",
          borderWidth: 2,
          borderColor: "#312E81",
        }}
      >
        <Text style={{ fontSize: 26, color: "#C4B5FD" }}>✦</Text>
        <Text className="text-[10px] mt-1 font-semibold" style={{ color: "#C4B5FD" }}>
          미사용
        </Text>
      </View>
    );
  }
  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{
        width: 72,
        height: 92,
        backgroundColor: "#ECFDF5",
        borderWidth: 2,
        borderColor: "#34D399",
      }}
    >
      <Text className="text-3xl">{emoji}</Text>
      <Text className="text-[11px] text-ink mt-1 font-semibold">{name}</Text>
    </View>
  );
}
