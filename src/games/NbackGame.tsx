import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { Glyph } from "@/src/components/Glyph";
import { TimerBar } from "@/src/components/TimerBar";
import { GLYPH_NAME, makeNbackSet, type NbackTrial } from "@/src/games/logic/nback";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.nback;
const SHOW_MS = 2800;

type Answer = "none" | "n2" | "n3";

export function NbackGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const setData = useRef(makeNbackSet()).current;
  const sequence = useRef<NbackTrial[]>([...setData.round1, ...setData.round2]).current;
  const round1Len = setData.round1.length;
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [pressed, setPressed] = useState<Answer | null>(null);
  const startedAt = useRef(Date.now());
  const shownAt = useRef(Date.now());
  const lock = useRef(false);
  const flash = usePlayFlash(1400);
  const trial = sequence[index];
  const isRound2 = index >= round1Len;

  const remaining = useCountdown(
    ready && !!trial && !!trial.comparable,
    SHOW_MS,
    () => {
      if (!trial || lock.current) return;
      answer(null, true);
    },
    index
  );

  useEffect(() => {
    if (!ready || !trial || trial.comparable || lock.current) return;
    const id = setTimeout(() => {
      const log: TrialLog = {
        index,
        correct: true,
        reactionMs: 0,
        detail: `${trial.n}-back 기억 단계`,
      };
      setTrials((t) => [...t, log]);
      setIndex((i) => i + 1);
      shownAt.current = Date.now();
    }, 900);
    return () => clearTimeout(id);
  }, [ready, index, trial]);

  function correctAnswer(t: NbackTrial): Answer {
    if (!t.comparable || !t.match) return "none";
    return t.n === 2 ? "n2" : "n3";
  }

  function wrap(all: TrialLog[]) {
    const acc = (xs: TrialLog[]) =>
      xs.length ? Math.round((xs.filter((t) => t.correct).length / xs.length) * 100) : 0;
    finish(
      buildPayload({
        gameId: "nback",
        gameTitle: meta.title,
        startedAt: startedAt.current,
        trials: all,
        extra: {
          n2Accuracy: acc(all.filter((t) => t.detail?.includes("2-back ·"))),
          n3Accuracy: acc(all.filter((t) => t.detail?.includes("3-back ·"))),
          round2Accuracy: acc(all.filter((t) => t.index >= round1Len)),
        },
      })
    );
    router.replace("/result");
  }

  function answer(choice: Answer | null, timeout = false) {
    if (!trial || lock.current || !trial.comparable) return;
    lock.current = true;
    setPressed(choice);
    const want = correctAnswer(trial);
    const correct = !timeout && choice === want;
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text:
          want === "none"
            ? "두 번째·세 번째 전 도형과 모두 달랐어요(SPACE). 도형에 이름을 붙이며 세어보세요."
            : `${want === "n2" ? "두 번째" : "세 번째"} 전 도형(${GLYPH_NAME[trial.glyph]})과 같았어요.`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      timeout,
      reactionMs: Date.now() - shownAt.current,
      detail: `${trial.n}-back · ${GLYPH_NAME[trial.glyph]} · ${trial.match ? "일치" : "불일치"}`,
    };
    const next = [...trials, log];
    setTimeout(() => {
      lock.current = false;
      setPressed(null);
      if (index + 1 >= sequence.length) wrap(next);
      else {
        setTrials(next);
        setIndex((i) => i + 1);
        shownAt.current = Date.now();
      }
    }, 180);
  }

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        shownAt.current = Date.now();
        setReady(true);
      }}
      progressLabel={
        ready
          ? `${isRound2 ? "2라운드 (2·3번째 전)" : "1라운드 (2번째 전)"} · ${index + 1}/${sequence.length}`
          : undefined
      }
      liveTip={
        isRound2
          ? "SPACE 둘 다 아님 / ← 두 번째 전 / → 세 번째 전. 머릿속 도형 배열을 매번 업데이트하세요."
          : "SPACE 다름 / ← 두 번째 전과 같음. 도형에 이름을 붙이며 세면 훨씬 쉬워요."
      }
      flash={flash.flash}
      onHardwareKey={(key) => {
        if (key === " ") answer("none");
        else if (key === "ArrowLeft") answer("n2");
        else if (key === "ArrowRight" && isRound2) answer("n3");
      }}
    >
      {trial ? (
        <View className="flex-1">
          <TimerBar ratio={trial.comparable ? remaining / SHOW_MS : 1} color="#C084FC" />
          <View
            className="items-center mt-4 rounded-3xl bg-white py-8"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <View className="h-[130px] items-center justify-center">
              <Glyph id={trial.glyph} />
            </View>
            <Text className="text-muted mt-2">
              {trial.comparable
                ? isRound2
                  ? "몇 번째 전의 도형과 같나요?"
                  : "두 번째 전의 도형과 같나요?"
                : "제시되는 도형을 기억해 주세요"}
            </Text>
          </View>

          <View className="mt-4 gap-2">
            <AnswerRow
              keyLabel="SPACE BAR"
              text={isRound2 ? "다름 (둘 다 아님)" : "다름 (두 번째 전과 다름)"}
              disabled={!trial.comparable}
              active={pressed === "none"}
              onPress={() => answer("none")}
            />
            <AnswerRow
              keyLabel="←"
              text="같음 (두 번째 전)"
              disabled={!trial.comparable}
              active={pressed === "n2"}
              onPress={() => answer("n2")}
            />
            {isRound2 ? (
              <AnswerRow
                keyLabel="→"
                text="같음 (세 번째 전)"
                disabled={!trial.comparable}
                active={pressed === "n3"}
                onPress={() => answer("n3")}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </GameShell>
  );
}

function AnswerRow({
  keyLabel,
  text,
  disabled,
  active,
  onPress,
}: {
  keyLabel: string;
  text: string;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center rounded-2xl px-4 py-4 active:opacity-70"
      style={{
        backgroundColor: active ? "#EDE9FE" : "#FFFFFF",
        borderWidth: active ? 3 : 1.5,
        borderColor: active ? "#7C3AED" : "#E7DDD8",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View className="rounded-lg px-3 py-1" style={{ backgroundColor: "#F1F5F9" }}>
        <Text className="font-bold text-ink">{keyLabel}</Text>
      </View>
      <Text className="ml-3 font-semibold text-ink">{text}</Text>
    </Pressable>
  );
}
