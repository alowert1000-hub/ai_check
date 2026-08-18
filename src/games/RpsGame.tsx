import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { TimerBar } from "@/src/components/TimerBar";
import {
  HAND_EMOJI,
  HAND_KEY,
  HAND_LABEL,
  HAND_ORDER,
  ROUND1_LEN,
  ROUND2_LEN,
  makeRpsSet,
  type Hand,
  type RpsTurn,
} from "@/src/games/logic/rps";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const LIMIT = 3000;
const meta = GAME_MAP.rps;

export function RpsGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const [ready, setReady] = useState(false);
  const turns = useRef(makeRpsSet()).current;
  const [index, setIndex] = useState(0);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [pressed, setPressed] = useState<Hand | null>(null);
  const flash = usePlayFlash(1400);
  const startedAt = useRef(Date.now());
  const turnStarted = useRef(Date.now());
  const lock = useRef(false);
  const turn: RpsTurn | undefined = turns[index];

  const remaining = useCountdown(
    ready && !!turn,
    LIMIT,
    () => {
      if (!turn || lock.current) return;
      resolve(null, true);
    },
    index
  );

  function done(nextTrials: TrialLog[]) {
    finish(
      buildPayload({
        gameId: "rps",
        gameTitle: meta.title,
        startedAt: startedAt.current,
        trials: nextTrials,
        extra: {
          perspectiveSwitchErrors: nextTrials.filter(
            (t) => !t.correct && t.detail?.includes("상대 관점")
          ).length,
          meErrors: nextTrials.filter((t) => !t.correct && t.detail?.includes("나 관점")).length,
        },
      })
    );
    router.replace("/result");
  }

  function resolve(chosen: Hand | null, timeout = false) {
    if (!turn || lock.current) return;
    lock.current = true;
    setPressed(chosen);
    const correct = !!chosen && chosen === turn.answer;
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text:
          turn.perspective === "me"
            ? `물음표가 왼쪽(나)이니 상대를 이기는 손이 정답이에요. 정답은 ${HAND_LABEL[turn.answer]}.`
            : `물음표가 오른쪽(상대)이니 상대가 지는 손이 정답이에요. 정답은 ${HAND_LABEL[turn.answer]}.`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      reactionMs: Date.now() - turnStarted.current,
      timeout,
      detail: `${turn.perspective === "me" ? "나 관점" : "상대 관점"}${
        timeout ? " · 시간초과" : chosen ? ` · 선택 ${HAND_LABEL[chosen]}` : ""
      }`,
    };
    const nextTrials = [...trials, log];
    setTimeout(() => {
      lock.current = false;
      setPressed(null);
      if (index + 1 >= turns.length) done(nextTrials);
      else {
        setTrials(nextTrials);
        setIndex((i) => i + 1);
        turnStarted.current = Date.now();
      }
    }, 320);
  }

  const roundLabel =
    index < ROUND1_LEN
      ? "1라운드 · 나의 관점"
      : index < ROUND1_LEN + ROUND2_LEN
        ? "2라운드 · 상대의 관점"
        : "3라운드 · 랜덤";

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        turnStarted.current = Date.now();
        setReady(true);
      }}
      progressLabel={ready ? `${roundLabel} · ${index + 1}/${turns.length}` : undefined}
      liveTip={
        turn?.perspective === "me"
          ? "물음표가 왼쪽(나)이에요. 내가 이기도록 상대를 이기는 손을 고르세요. 가위 ← / 바위 ↓ / 보 →"
          : "물음표가 오른쪽(상대)이에요. 내가 이기도록 상대가 지는 손을 고르세요. 가위 ← / 바위 ↓ / 보 →"
      }
      flash={flash.flash}
      onHardwareKey={(key) => {
        if (key === "ArrowLeft") resolve("scissors");
        else if (key === "ArrowDown") resolve("rock");
        else if (key === "ArrowRight") resolve("paper");
      }}
    >
      {turn ? (
        <View className="flex-1">
          <TimerBar ratio={remaining / LIMIT} color="#0F766E" />

          <View
            className="mt-4 rounded-3xl bg-white p-5"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-center text-2xl font-bold text-ink">가위 바위 보!</Text>
            <View className="mt-5 flex-row items-center justify-between px-2">
              <Side
                avatar="🦝"
                name="나"
                hand={turn.perspective === "me" ? null : turn.shown}
                accent="#3D2C2E"
              />
              <Text className="text-xl font-bold text-muted">VS</Text>
              <Side
                avatar="🦦"
                name="상대"
                hand={turn.perspective === "me" ? turn.shown : null}
                accent="#0F766E"
              />
            </View>
            <Text className="mt-4 text-center text-muted">
              항상 '나'가 이기도록, 물음표 자리에 들어갈 손을 고르세요
            </Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            {HAND_ORDER.map((h) => {
              const on = pressed === h;
              return (
                <Pressable
                  key={h}
                  onPress={() => resolve(h)}
                  className="flex-1 items-center rounded-3xl py-5 active:opacity-80"
                  style={{
                    backgroundColor: on ? "#CCFBF1" : "#FFFFFF",
                    borderWidth: on ? 3 : 1.5,
                    borderColor: on ? "#0F766E" : "#E7DDD8",
                  }}
                >
                  <Text className="text-5xl">{HAND_EMOJI[h]}</Text>
                  <Text className="mt-2 font-bold text-ink">{HAND_LABEL[h]}</Text>
                  <View className="mt-1 rounded-lg px-2 py-0.5" style={{ backgroundColor: "#F1F5F9" }}>
                    <Text className="text-xs font-bold text-ink">{HAND_KEY[h]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-center text-[11px] text-muted mt-2">
            버튼 순서는 항상 가위 · 바위 · 보로 고정됩니다
          </Text>
        </View>
      ) : null}
    </GameShell>
  );
}

function Side({
  avatar,
  name,
  hand,
  accent,
}: {
  avatar: string;
  name: string;
  hand: Hand | null;
  accent: string;
}) {
  return (
    <View className="items-center">
      <Text className="text-4xl">{avatar}</Text>
      <Text className="text-sm font-bold mt-1" style={{ color: accent }}>
        {name}
      </Text>
      <View
        className="items-center justify-center rounded-2xl mt-2"
        style={{
          width: 92,
          height: 92,
          backgroundColor: hand ? "#CCFBF1" : "#E5E7EB",
          borderWidth: 2,
          borderColor: hand ? "#5EEAD4" : "#9CA3AF",
        }}
      >
        <Text className="text-4xl">{hand ? HAND_EMOJI[hand] : "?"}</Text>
      </View>
      <Text className="text-xs mt-1 font-semibold" style={{ color: hand ? "#1F2937" : "#9CA3AF" }}>
        {hand ? HAND_LABEL[hand] : "내가 고를 손"}
      </Text>
    </View>
  );
}
