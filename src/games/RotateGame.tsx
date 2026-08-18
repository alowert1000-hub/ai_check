import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { ShapeFigure } from "@/src/components/ShapeFigure";
import {
  OP_LABEL,
  OP_SHORT,
  applySteps,
  makeRotateSet,
  visuallyEqual,
  type RotateOp,
  type RotatePuzzle,
  type Transform,
} from "@/src/games/logic/rotate";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzLight, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.rotate;
const MAX_CLICKS = 20;
const MAX_STEPS = 8;

const OPS: { op: RotateOp; icon: string }[] = [
  { op: "ccw45", icon: "↺" },
  { op: "cw45", icon: "↻" },
  { op: "flipH", icon: "↔" },
  { op: "flipV", icon: "↕" },
];

export function RotateGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const puzzles = useRef(makeRotateSet(4)).current;
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<RotateOp[]>([]);
  const [clicksLeft, setClicksLeft] = useState(MAX_CLICKS);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const startedAt = useRef(Date.now());
  const puzzleStarted = useRef(Date.now());
  const flash = usePlayFlash(1900);

  const puzzle: RotatePuzzle = puzzles[index];
  const current: Transform = applySteps(steps);
  const isRound2 = index >= puzzles.length / 2;

  function spend(fn: () => void) {
    if (clicksLeft <= 0) {
      flash.show({ kind: "bad", text: "클릭 가능 횟수를 모두 썼어요. 답안을 제출해 주세요." });
      return;
    }
    setClicksLeft((n) => n - 1);
    buzzLight();
    fn();
  }

  function push(op: RotateOp) {
    if (steps.length >= MAX_STEPS) {
      flash.show({
        kind: "bad",
        text: "조작 기록은 8단계까지예요. '하나 지움'으로 마지막 조작을 취소할 수 있어요.",
      });
      return;
    }
    spend(() => setSteps((s) => [...s, op]));
  }

  function submit() {
    const correct = visuallyEqual(current, puzzle.target);
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text: `회전은 한 번에 45°예요. 90°로 착각하지 않았는지, 반전이 필요한지 확인해보세요. (최소 ${puzzle.minSteps}단계)`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      reactionMs: Date.now() - puzzleStarted.current,
      detail: correct
        ? `${puzzle.kind === "letter" ? "알파벳" : "도형"} · ${steps.length}단계(최소 ${puzzle.minSteps})`
        : `미일치 · ${puzzle.kind === "letter" ? "알파벳" : "도형"} · ${steps.length}단계`,
    };
    const next = [...trials, log];
    if (index + 1 >= puzzles.length) {
      finish(
        buildPayload({
          gameId: "rotate",
          gameTitle: meta.title,
          startedAt: startedAt.current,
          trials: next,
          extra: {
            clicksUsed: MAX_CLICKS - clicksLeft,
            letterErrors: next.filter((t) => !t.correct && t.detail?.includes("알파벳")).length,
            shapeErrors: next.filter((t) => !t.correct && t.detail?.includes("도형")).length,
          },
        })
      );
      router.replace("/result");
      return;
    }
    setTrials(next);
    setIndex((i) => i + 1);
    setSteps([]);
    setClicksLeft(MAX_CLICKS);
    puzzleStarted.current = Date.now();
  }

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        puzzleStarted.current = Date.now();
        setReady(true);
      }}
      progressLabel={
        ready
          ? `${isRound2 ? "2라운드 도형" : "1라운드 알파벳"} · ${index + 1}/${puzzles.length}`
          : undefined
      }
      liveTip="회전은 한 번에 45°씩! 마름모가 정사각형이 되는 것도 45° 회전이에요. 기준을 정하고 최소 클릭으로."
      flash={flash.flash}
    >
      <View className="flex-1">
        <View className="flex-row gap-3 items-center">
          <Figure title="전" puzzle={puzzle} transform={{ rotation: 0, flipX: false, flipY: false }} />
          <Text className="text-2xl" style={{ color: "#047857" }}>
            →
          </Text>
          <Figure title="후 (목표)" puzzle={puzzle} transform={puzzle.target} highlight />
        </View>

        <View
          className="items-center rounded-3xl bg-white py-3 mt-3"
          style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
        >
          <Text className="text-xs text-muted mb-1">현재 내 도형</Text>
          <Body puzzle={puzzle} transform={current} accent="#1D4ED8" />
        </View>

        <View className="flex-row flex-wrap gap-2 mt-3">
          {OPS.map((item) => (
            <Pressable
              key={item.op}
              onPress={() => push(item.op)}
              className="rounded-2xl bg-white px-2 py-3 items-center active:opacity-70"
              style={{ minWidth: "23%", flexGrow: 1, borderWidth: 1.5, borderColor: "#BBF7D0" }}
            >
              <Text className="text-xl" style={{ color: "#047857" }}>
                {item.icon}
              </Text>
              <Text className="text-[11px] font-bold text-ink mt-1 text-center">
                {OP_LABEL[item.op]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-2 mt-3">
          <View
            className="flex-1 rounded-2xl bg-white p-3"
            style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
          >
            <Text className="text-[11px] text-muted">
              조작 기록 {steps.length}/{MAX_STEPS}단계
            </Text>
            <View className="flex-row flex-wrap gap-1 mt-2">
              {Array.from({ length: MAX_STEPS }, (_, i) => {
                const op = steps[i];
                return (
                  <View
                    key={i}
                    className="rounded-lg items-center justify-center"
                    style={{
                      width: 36,
                      height: 34,
                      backgroundColor: op ? "#DBEAFE" : "#F8FAFC",
                      borderWidth: 1,
                      borderColor: op ? "#93C5FD" : "#E2E8F0",
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: op ? "#1E3A8A" : "#CBD5E1" }}
                    >
                      {op ? OP_SHORT[op] : i + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View
            className="rounded-2xl bg-white p-3 items-center justify-center"
            style={{ borderWidth: 1, borderColor: "#E7DDD8", minWidth: 112 }}
          >
            <Text className="text-[11px] text-muted">남은 클릭 횟수</Text>
            <Text className="text-2xl font-bold text-ink">{clicksLeft}</Text>
            <Pressable
              onPress={() => spend(() => setSteps((s) => s.slice(0, -1)))}
              className="rounded-lg px-2 py-1 mt-1"
              style={{ backgroundColor: "#F1F5F9" }}
            >
              <Text className="text-[11px] font-bold text-ink">하나 지움</Text>
            </Pressable>
            <Pressable
              onPress={() => spend(() => setSteps([]))}
              className="rounded-lg px-2 py-1 mt-1"
              style={{ backgroundColor: "#F1F5F9" }}
            >
              <Text className="text-[11px] font-bold text-ink">전체 초기화</Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-3">
          <PrimaryButton label="답안 제출" onPress={submit} />
        </View>
      </View>
    </GameShell>
  );
}

function Figure({
  title,
  puzzle,
  transform,
  highlight,
}: {
  title: string;
  puzzle: RotatePuzzle;
  transform: Transform;
  highlight?: boolean;
}) {
  return (
    <View
      className="flex-1 items-center rounded-3xl py-4"
      style={{
        backgroundColor: highlight ? "#ECFDF5" : "#FFFFFF",
        borderWidth: 1,
        borderColor: highlight ? "#A7F3D0" : "#E7DDD8",
      }}
    >
      <Text className="text-xs text-muted mb-1">{title}</Text>
      <Body puzzle={puzzle} transform={transform} accent={highlight ? "#047857" : "#3D2C2E"} />
    </View>
  );
}

function Body({
  puzzle,
  transform,
  accent,
}: {
  puzzle: RotatePuzzle;
  transform: Transform;
  accent: string;
}) {
  if (puzzle.kind === "shape") {
    return <ShapeFigure transform={transform} accent={accent} cell={16} />;
  }
  return (
    <View style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: 58,
          fontWeight: "800",
          color: accent,
          transform: [
            { scaleX: transform.flipX ? -1 : 1 },
            { scaleY: transform.flipY ? -1 : 1 },
            { rotate: `${transform.rotation}deg` },
          ],
        }}
      >
        {puzzle.letter}
      </Text>
    </View>
  );
}
