import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { TimerBar } from "@/src/components/TimerBar";
import { makeCompareSet, type CompareTrial, type Side } from "@/src/games/logic/compare";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.compare;
const SHOW_MS = 1000;
const THINK_MS = 3000;

export function CompareGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const setData = useRef(makeCompareSet(16)).current;
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(true);
  const [picked, setPicked] = useState<Side | null>(null);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const startedAt = useRef(Date.now());
  const askedAt = useRef(Date.now());
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = useRef(false);
  const flash = usePlayFlash(1600);
  const trial: CompareTrial = setData[index];

  useEffect(
    () => () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    },
    []
  );

  const remaining = useCountdown(
    ready && !showing,
    THINK_MS,
    () => {
      if (showing || lock.current) return;
      choose(null, true);
    },
    index
  );

  function armShow() {
    setShowing(true);
    setPicked(null);
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      setShowing(false);
      askedAt.current = Date.now();
    }, SHOW_MS);
  }

  function choose(side: Side | null, timeout = false) {
    if (lock.current) return;
    lock.current = true;
    setPicked(side);
    const correct = side === trial.answer;
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      const answerLabel =
        trial.mode === "word"
          ? `'${trial.answer === "left" ? trial.leftWord : trial.rightWord}'`
          : trial.answer === "left"
            ? "왼쪽"
            : "오른쪽";
      flash.show({
        kind: "bad",
        text: timeout
          ? `시간 초과예요. 생각하는 시간은 3초, 직관으로 고르세요. 정답은 ${answerLabel}.`
          : `의미가 아니라 개수예요. 정답은 ${answerLabel} (${Math.max(trial.left, trial.right)}개).`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      timeout,
      reactionMs: Date.now() - askedAt.current,
      detail: timeout ? "시간 초과" : `${trial.left} vs ${trial.right}`,
    };
    const next = [...trials, log];
    setTimeout(() => {
      lock.current = false;
      if (index + 1 >= setData.length) {
        finish(
          buildPayload({
            gameId: "compare",
            gameTitle: meta.title,
            startedAt: startedAt.current,
            trials: next,
            extra: {
              closeCallErrors: next.filter(
                (t, i) => !t.correct && Math.abs(setData[i].left - setData[i].right) <= 2
              ).length,
            },
          })
        );
        router.replace("/result");
        return;
      }
      setTrials(next);
      setIndex((i) => i + 1);
      armShow();
    }, 380);
  }

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        askedAt.current = Date.now();
        setReady(true);
        armShow();
      }}
      progressLabel={ready ? `남은 문항 ${setData.length - index - 1}` : undefined}
      liveTip={
        showing
          ? "1초만 보여요. 계산하지 말고 시각적 밀도로만 판단하세요."
          : "생각하는 시간은 3초! 직관적으로 더 많아 보였던 쪽을 고르세요."
      }
      flash={flash.flash}
    >
      <View className="flex-1">
        {!showing ? (
          <TimerBar ratio={remaining / THINK_MS} color="#0369A1" />
        ) : (
          <View className="h-2" />
        )}
        <Text className="text-center font-bold text-ink mt-3">
          {showing
            ? "화면을 잘 보세요"
            : trial.mode === "word"
              ? "어떤 단어의 개수가 더 많았는지 선택해 주세요"
              : "어느 쪽의 점이 더 많았는지 선택해 주세요"}
        </Text>

        <View className="flex-row gap-3 mt-3">
          <Panel trial={trial} side="left" visible={showing} />
          <Panel trial={trial} side="right" visible={showing} />
        </View>

        <View className="flex-row gap-3 mt-5 justify-center">
          <ChoiceButton
            label={trial.mode === "word" ? trial.leftWord : "왼쪽"}
            tone="teal"
            disabled={showing}
            active={picked === "left"}
            onPress={() => !showing && choose("left")}
          />
          <ChoiceButton
            label={trial.mode === "word" ? trial.rightWord : "오른쪽"}
            tone="slate"
            disabled={showing}
            active={picked === "right"}
            onPress={() => !showing && choose("right")}
          />
        </View>
      </View>
    </GameShell>
  );
}

function ChoiceButton({
  label,
  tone,
  disabled,
  active,
  onPress,
}: {
  label: string;
  tone: "teal" | "slate";
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  const base = tone === "teal" ? "#CCFBF1" : "#E5E7EB";
  const border = tone === "teal" ? "#0F766E" : "#4B5563";
  const text = tone === "teal" ? "#134E4A" : "#1F2937";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center justify-center rounded-2xl px-8 py-6 active:opacity-80"
      style={{
        backgroundColor: disabled ? "#F1F5F9" : base,
        borderWidth: active ? 3 : 2,
        borderColor: disabled ? "#E2E8F0" : border,
        opacity: disabled ? 0.5 : 1,
        minWidth: 132,
      }}
    >
      <Text className="text-2xl font-bold" style={{ color: disabled ? "#94A3B8" : text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Panel({
  trial,
  side,
  visible,
}: {
  trial: CompareTrial;
  side: Side;
  visible: boolean;
}) {
  const isLeft = side === "left";
  const marks = isLeft ? trial.leftMarks : trial.rightMarks;
  const word = isLeft ? trial.leftWord : trial.rightWord;
  const color = isLeft ? "#0F766E" : "#334155";
  return (
    <View
      className="flex-1 rounded-3xl bg-white overflow-hidden"
      style={{ height: 240, borderWidth: 1, borderColor: "#E7DDD8" }}
    >
      {visible ? (
        <View className="flex-1 m-2">
          {marks.map((d, i) =>
            trial.mode === "word" ? (
              <Text
                key={`${side}-${i}`}
                style={{
                  position: "absolute",
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  fontSize: 13,
                  fontWeight: "700",
                  color,
                  transform: [{ rotate: `${d.rot}deg` }],
                }}
              >
                {word}
              </Text>
            ) : (
              <View
                key={`${side}-${i}`}
                style={{
                  position: "absolute",
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: color,
                }}
              />
            )
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl text-muted">?</Text>
        </View>
      )}
    </View>
  );
}
