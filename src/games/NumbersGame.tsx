import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { TimerBar } from "@/src/components/TimerBar";
import {
  makeFlashSequence,
  makeKeypadLayout,
  makeNumberCondition,
} from "@/src/games/logic/numbers";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzLight, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.numbers;
const FLASH_MS = 1400;

type Hit = { n: number; ok: boolean } | null;

function Keypad({
  layout,
  highlight,
  hit,
  onPress,
}: {
  layout: number[];
  highlight?: number | null;
  hit: Hit;
  onPress: (n: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-center gap-2 mt-4">
      {layout.map((n) => {
        const active = highlight === n;
        const hitting = hit?.n === n;
        const bg = hitting ? (hit!.ok ? "#BBF7D0" : "#FECACA") : active ? "#FDE68A" : "#FFFFFF";
        const border = hitting
          ? hit!.ok
            ? "#15803D"
            : "#B91C1C"
          : active
            ? "#B45309"
            : "#E7DDD8";
        return (
          <Pressable
            key={n}
            onPress={() => onPress(n)}
            className="items-center justify-center rounded-2xl active:opacity-70"
            style={{
              width: "30%",
              aspectRatio: 1.15,
              backgroundColor: bg,
              borderWidth: hitting || active ? 3 : 1.5,
              borderColor: border,
              transform: [{ scale: hitting ? 0.96 : 1 }],
            }}
          >
            <Text className="text-3xl font-bold" style={{ color: "#1F2937" }}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NumbersGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const seq = useRef(makeFlashSequence(16)).current;
  const condition = useRef(makeNumberCondition()).current;
  const [layout, setLayout] = useState(() => makeKeypadLayout());
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"flash" | "seq">("flash");
  const [fi, setFi] = useState(0);
  const [ptr, setPtr] = useState(0);
  const [hit, setHit] = useState<Hit>(null);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const startedAt = useRef(Date.now());
  const beatStarted = useRef(Date.now());
  const lock = useRef(false);
  const flash = usePlayFlash(1600);

  const remaining = useCountdown(
    ready && phase === "flash" && fi < seq.length,
    FLASH_MS,
    () => {
      if (phase !== "flash" || lock.current) return;
      recordFlash(0, false, true);
    },
    fi
  );

  function pulse(n: number, ok: boolean) {
    setHit({ n, ok });
    setTimeout(() => setHit(null), 220);
  }

  function wrapUp(all: TrialLog[]) {
    finish(
      buildPayload({
        gameId: "numbers",
        gameTitle: meta.title,
        startedAt: startedAt.current,
        trials: all,
        extra: {
          skipMiss: all.some((t) => !t.correct && t.detail?.includes("건너뛰기")),
          condition: condition.label,
        },
      })
    );
    router.replace("/result");
  }

  function recordFlash(tapped: number, correct: boolean, timeout = false) {
    if (lock.current) return;
    lock.current = true;
    if (!timeout) pulse(tapped, correct);
    if (correct) buzzOk();
    else buzzBad();
    if (!correct && !timeout) {
      flash.show({ kind: "bad", text: "활성화된 숫자만 누르세요. 배열이 매번 바뀌니 위치부터 확인!" });
    }
    const log: TrialLog = {
      index: fi,
      correct,
      timeout,
      reactionMs: Date.now() - beatStarted.current,
      detail: `점등 ${seq[fi]}${timeout ? " 시간초과" : ""}`,
    };
    const next = [...trials, log];
    setTimeout(() => {
      lock.current = false;
      setTrials(next);
      if (fi + 1 >= seq.length) {
        setPhase("seq");
        setPtr(0);
        setLayout(makeKeypadLayout());
      } else {
        setFi((v) => v + 1);
        setLayout(makeKeypadLayout());
      }
      beatStarted.current = Date.now();
    }, 200);
  }

  function onSeqTap(n: number) {
    const expected = condition.expected[ptr];
    const correct = n === expected;
    pulse(n, correct);
    if (correct) buzzLight();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text: condition.skip.includes(n)
          ? `${n}은 건너뛰어야 하는 숫자예요. 실수는 되돌릴 수 없으니 건너뛰기부터 되뇌세요.`
          : `다음에 눌러야 할 숫자는 ${expected}였어요. 두 번 누르기 규칙도 함께 확인하세요.`,
      });
    }
    const log: TrialLog = {
      index: 100 + ptr,
      correct,
      reactionMs: Date.now() - beatStarted.current,
      detail: correct
        ? `순서 ${n}`
        : condition.skip.includes(n)
          ? `건너뛰기 ${n}를 누름`
          : `기대 ${expected} / 입력 ${n}`,
    };
    const next = [...trials, log];
    beatStarted.current = Date.now();
    if (!correct) {
      setTrials(next);
      return;
    }
    if (ptr + 1 >= condition.expected.length) wrapUp(next);
    else {
      setTrials(next);
      setPtr((p) => p + 1);
    }
  }

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        beatStarted.current = Date.now();
        setReady(true);
      }}
      progressLabel={
        ready
          ? phase === "flash"
            ? `1라운드 ${fi + 1}/${seq.length}`
            : `2라운드 ${ptr}/${condition.expected.length}`
          : undefined
      }
      liveTip={
        phase === "flash"
          ? "활성화된 숫자만 최대한 빠르게! 버튼 배열이 매번 바뀌니 배열부터 확인하세요."
          : "건너뛰어야 하는 숫자를 먼저 되뇌세요. 반응을 억제하는 것이 이 라운드의 핵심입니다."
      }
      flash={flash.flash}
    >
      {phase === "flash" ? (
        <View>
          <TimerBar ratio={remaining / FLASH_MS} color="#B45309" />
          <Text className="text-center mt-4 text-ink font-bold">
            활성화된 숫자를{"\n"}최대한 빠르게 눌러 주세요!
          </Text>
          <Keypad
            layout={layout}
            highlight={seq[fi]}
            hit={hit}
            onPress={(n) => recordFlash(n, n === seq[fi])}
          />
        </View>
      ) : (
        <View>
          <View
            className="rounded-3xl p-4"
            style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D" }}
          >
            <Text className="font-bold text-ink text-center">{condition.label}</Text>
            <Text className="text-center text-muted text-xs mt-1">
              1부터 9까지 순서대로, 규칙에 맞게 눌러 주세요
            </Text>
          </View>
          <Keypad layout={layout} hit={hit} onPress={onSeqTap} />
        </View>
      )}
    </GameShell>
  );
}
