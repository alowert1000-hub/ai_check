import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { TimerBar } from "@/src/components/TimerBar";
import { GRID, makeCatSet } from "@/src/games/logic/cat";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.cat;
const MEMORIZE_MS = 2600;
/** 판단·확신도 모두 짧고 엄격한 제한 시간이 걸린다. */
const JUDGE_MS = 2500;
const CONF_MS = 2500;
const CONFIDENCE = ["확신 없음", "조금", "보통", "꽤 확신", "매우 확신"];

type Step = "memorize" | "redJudge" | "redConf" | "blueJudge" | "blueConf";

export function CatGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const rounds = useRef(makeCatSet(9)).current;
  const [ready, setReady] = useState(false);
  const [ri, setRi] = useState(0);
  const [step, setStep] = useState<Step>("memorize");
  const [pending, setPending] = useState<{ correct: boolean; was: boolean } | null>(null);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const startedAt = useRef(Date.now());
  const stepStarted = useRef(Date.now());
  const lock = useRef(false);
  const flash = usePlayFlash(1600);

  const round = rounds[ri];
  const mice = new Set(round.mice);
  const { width } = useWindowDimensions();
  const cell = Math.min(50, Math.floor((Math.min(width, 640) - 64) / GRID));

  useEffect(() => {
    if (!ready || step !== "memorize") return;
    const id = setTimeout(() => {
      setStep("redJudge");
      stepStarted.current = Date.now();
    }, MEMORIZE_MS);
    return () => clearTimeout(id);
  }, [ready, step, ri]);

  const isJudge = step === "redJudge" || step === "blueJudge";
  const isConf = step === "redConf" || step === "blueConf";

  const judgeLeft = useCountdown(
    ready && isJudge,
    JUDGE_MS,
    () => {
      if (!isJudge || lock.current) return;
      judge(step === "redJudge" ? "red" : "blue", null);
    },
    `${ri}-${step}`
  );

  const confLeft = useCountdown(
    ready && isConf,
    CONF_MS,
    () => {
      if (!isConf || lock.current) return;
      commitConfidence(1, true);
    },
    `${ri}-${step}`
  );

  function judge(color: "red" | "blue", said: boolean | null) {
    if (lock.current) return;
    const cat = round.cats.find((c) => c.color === color)!;
    const was = mice.has(cat.cell);
    const correct = said === was;
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text:
          said === null
            ? `시간 초과예요. 응답 시간이 짧으니 빠르게 판단하세요. ${color === "red" ? "빨간" : "파란"} 칸엔 생쥐가 ${was ? "있었어요" : "없었어요"}.`
            : `${color === "red" ? "빨간" : "파란"} 칸에는 생쥐가 ${was ? "있었어요" : "없었어요"}. 확신도는 솔직하게 낮춰도 괜찮아요.`,
      });
    }
    setPending({ correct, was });
    setStep(color === "red" ? "redConf" : "blueConf");
    stepStarted.current = Date.now();
  }

  function commitConfidence(level: number, timeout = false) {
    if (lock.current) return;
    lock.current = true;
    const color = step === "redConf" ? "red" : "blue";
    const correct = pending?.correct ?? false;
    const was = pending?.was ?? false;
    const log: TrialLog = {
      index: ri * 2 + (color === "red" ? 0 : 1),
      correct,
      timeout,
      reactionMs: Date.now() - stepStarted.current,
      detail: `${color === "red" ? "빨간" : "파란"} 고양이 ${was ? "잡음" : "놓침"} · 확신 ${level}${
        !correct && level >= 4 ? " · 과신" : ""
      }${timeout ? " · 확신도 시간초과" : ""}`,
    };
    const next = [...trials, log];
    setPending(null);

    setTimeout(() => {
      lock.current = false;
      if (color === "red") {
        setTrials(next);
        setStep("blueJudge");
        stepStarted.current = Date.now();
        return;
      }
      if (ri + 1 >= rounds.length) {
        finish(
          buildPayload({
            gameId: "cat",
            gameTitle: meta.title,
            startedAt: startedAt.current,
            trials: next,
            extra: {
              overconfidence: next.some((t) => t.detail?.includes("과신")),
              overconfidentCount: next.filter((t) => t.detail?.includes("과신")).length,
            },
          })
        );
        router.replace("/result");
        return;
      }
      setTrials(next);
      setRi((v) => v + 1);
      setStep("memorize");
      stepStarted.current = Date.now();
    }, 240);
  }

  const askColor: "red" | "blue" = step === "blueJudge" || step === "blueConf" ? "blue" : "red";

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        stepStarted.current = Date.now();
        setReady(true);
        setStep("memorize");
      }}
      progressLabel={ready ? `남은 문항 ${rounds.length - ri - 1}` : undefined}
      liveTip={
        step === "memorize"
          ? "생쥐 무리의 위치를 행·열로 짧게 외워두세요. 곧 가려집니다."
          : askColor === "red"
            ? "빨강이 먼저! 빨간 칸 고양이가 생쥐를 찾았는지 판단하고 바로 확신도를 고르세요."
            : "이제 파란 칸 차례예요. 판단보다 '확신하는 정도'가 더 중요합니다."
      }
      flash={flash.flash}
    >
      <View className="flex-1">
        {step === "memorize" ? (
          <View className="h-2" />
        ) : (
          <TimerBar
            ratio={isJudge ? judgeLeft / JUDGE_MS : confLeft / CONF_MS}
            color={askColor === "red" ? "#DC2626" : "#2563EB"}
          />
        )}

        <Text className="text-center font-bold text-ink my-2">
          {step === "memorize"
            ? "생쥐 무리가 등장하는 위치를 기억하세요"
            : isConf
              ? `방금 ${askColor === "red" ? "빨간" : "파란"} 칸 판단을 얼마나 확신하나요?`
              : `${askColor === "red" ? "빨간" : "파란"} 칸의 고양이가 생쥐를 찾았나요?`}
        </Text>

        <View
          className="self-center rounded-3xl bg-white p-2"
          style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
        >
          {Array.from({ length: GRID }, (_, r) => (
            <View key={r} className="flex-row">
              {Array.from({ length: GRID }, (_, c) => {
                const i = r * GRID + c;
                const mouse = step === "memorize" && mice.has(i);
                const cat = step !== "memorize" ? round.cats.find((x) => x.cell === i) : undefined;
                const focused =
                  cat && ((askColor === "red" && cat.color === "red") || (askColor === "blue" && cat.color === "blue"));
                const bg =
                  cat?.color === "red" ? "#DC2626" : cat?.color === "blue" ? "#2563EB" : "#F8FAFC";
                return (
                  <View
                    key={i}
                    className="items-center justify-center rounded-lg m-0.5"
                    style={{
                      width: cell,
                      height: cell,
                      backgroundColor: bg,
                      borderWidth: focused ? 3 : 1,
                      borderColor: focused ? "#111827" : "#E2E8F0",
                    }}
                  >
                    <Text style={{ fontSize: cell * 0.55 }}>{mouse ? "🐭" : cat ? "🐱" : ""}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {isJudge ? (
          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={() => judge(askColor, true)}
              className="flex-1 items-center rounded-2xl py-5 active:opacity-80"
              style={{ backgroundColor: "#DCFCE7", borderWidth: 2, borderColor: "#16A34A" }}
            >
              <Text className="text-lg font-bold" style={{ color: "#14532D" }}>
                잡았다 (있었음)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => judge(askColor, false)}
              className="flex-1 items-center rounded-2xl py-5 active:opacity-80"
              style={{ backgroundColor: "#FEE2E2", borderWidth: 2, borderColor: "#DC2626" }}
            >
              <Text className="text-lg font-bold" style={{ color: "#7F1D1D" }}>
                놓쳤다 (없었음)
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isConf ? (
          <View className="mt-5">
            <View className="flex-row gap-2">
              {CONFIDENCE.map((label, i) => (
                <Pressable
                  key={label}
                  onPress={() => commitConfidence(i + 1)}
                  className="flex-1 items-center rounded-2xl bg-white py-4 active:opacity-70"
                  style={{ borderWidth: 1.5, borderColor: "#E7DDD8" }}
                >
                  <Text className="font-bold text-ink">{i + 1}</Text>
                  <Text className="text-[10px] text-muted mt-1 text-center">{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-center text-xs text-muted mt-2">
              모르겠으면 낮게! 내가 모른다는 걸 아는 것이 메타인지 점수예요.
            </Text>
          </View>
        ) : null}
      </View>
    </GameShell>
  );
}
