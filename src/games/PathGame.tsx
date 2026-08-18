import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { TimerBar } from "@/src/components/TimerBar";
import {
  DIR_ARROW,
  cycleFence,
  driveAll,
  keyOf,
  makePathPuzzle,
  type Fence,
  type PathPuzzle,
} from "@/src/games/logic/path";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzLight, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.path;
const TOTAL_MS = 5 * 60 * 1000;

export function PathGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<PathPuzzle>(() => makePathPuzzle(0));
  const [board, setBoard] = useState<Record<string, Fence>>({});
  const [clicksLeft, setClicksLeft] = useState(() => puzzle.clickBudget);
  const [preview, setPreview] = useState<string[]>([]);
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [leftMs, setLeftMs] = useState(TOTAL_MS);
  const startedAt = useRef(Date.now());
  const puzzleStarted = useRef(Date.now());
  const trialsRef = useRef<TrialLog[]>([]);
  const doneRef = useRef(false);
  const flash = usePlayFlash(2000);

  const used = Object.keys(board).length;
  const cell = Math.min(46, Math.floor((Math.min(width, 720) - 64) / puzzle.cols));
  const previewSet = useMemo(() => new Set(preview), [preview]);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const left = Math.max(0, TOTAL_MS - (Date.now() - startedAt.current));
      setLeftMs(left);
      if (left <= 0) wrapUp();
    }, 250);
    return () => clearInterval(id);
  }, [ready]);

  function wrapUp() {
    if (doneRef.current) return;
    doneRef.current = true;
    const all = trialsRef.current;
    finish(
      buildPayload({
        gameId: "path",
        gameTitle: meta.title,
        startedAt: startedAt.current,
        trials: all.length ? all : [{ index: 0, correct: false, reactionMs: 0, detail: "미완료" }],
        extra: {
          solved: all.filter((t) => t.correct).length,
          overBudget: all.filter((t) => t.detail?.includes("초과")).length,
        },
      })
    );
    router.replace("/result");
  }

  function tap(r: number, c: number) {
    const k = keyOf(r, c);
    if (puzzle.vehicles.some((v) => v.start.r === r && v.start.c === c)) return;
    if (puzzle.vehicles.some((v) => v.goal.r === r && v.goal.c === c)) return;
    if (clicksLeft <= 0) {
      flash.show({ kind: "bad", text: "클릭 가능 횟수를 모두 썼어요. 제출하고 다음 문제로 가세요." });
      return;
    }
    buzzLight();
    setClicksLeft((n) => n - 1);
    setBoard((prev) => {
      const next = { ...prev };
      const v = cycleFence(prev[k]);
      if (!v) delete next[k];
      else next[k] = v;
      return next;
    });
    setPreview([]);
  }

  function submit() {
    const result = driveAll(puzzle, board);
    const over = used > puzzle.budget;
    const correct = result.ok && !over;
    setPreview(result.paths.flat().map((p) => keyOf(p.r, p.c)));
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text: over
          ? `울타리 ${used}/${puzzle.budget} 초과예요. 정답의 울타리 수와 같아야 최대 득점입니다.`
          : `${puzzle.vehicles.length - result.arrived}대가 손님에게 도착하지 못했어요. 한 대라도 못 가면 오답입니다.`,
      });
    }
    const log: TrialLog = {
      index,
      correct,
      reactionMs: Date.now() - puzzleStarted.current,
      detail: correct
        ? `울타리 ${used}/${puzzle.budget}`
        : over
          ? `울타리 초과 ${used}/${puzzle.budget}`
          : `미도착 ${puzzle.vehicles.length - result.arrived}대`,
    };
    const next = [...trials, log];
    trialsRef.current = next;
    setTimeout(
      () => {
        if (Date.now() - startedAt.current >= TOTAL_MS) {
          wrapUp();
          return;
        }
        const nextPuzzle = makePathPuzzle(Math.min(3, Math.floor((index + 1) / 2)));
        setTrials(next);
        setIndex((i) => i + 1);
        setPuzzle(nextPuzzle);
        setClicksLeft(nextPuzzle.clickBudget);
        setBoard({});
        setPreview([]);
        puzzleStarted.current = Date.now();
      },
      correct ? 600 : 1300
    );
  }

  const mm = Math.floor(leftMs / 60000);
  const ss = Math.floor((leftMs % 60000) / 1000);

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        puzzleStarted.current = Date.now();
        setReady(true);
      }}
      progressLabel={ready ? `문제 ${index + 1} · ${mm}:${String(ss).padStart(2, "0")}` : undefined}
      liveTip="정답의 울타리 수부터 확인! 마주 보면 2개, 90°면 1개. 정답 수가 더 많으면 둘러가라는 뜻이에요."
      flash={flash.flash}
    >
      <View className="items-center">
        <View className="w-full mb-2">
          <TimerBar ratio={leftMs / TOTAL_MS} color="#047857" />
        </View>

        <View className="flex-row gap-2 w-full mb-2">
          <Counter label="클릭 가능 횟수" value={String(clicksLeft)} />
          <Counter label="정답의 울타리 수" value={String(puzzle.budget)} />
          <Counter label="설치한 울타리" value={`${used}`} accent={used > puzzle.budget} />
        </View>

        <View
          className="rounded-3xl bg-white p-2"
          style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
        >
          {Array.from({ length: puzzle.rows }, (_, r) => (
            <View key={r} className="flex-row">
              {Array.from({ length: puzzle.cols }, (_, c) => {
                const k = keyOf(r, c);
                const vi = puzzle.vehicles.findIndex((v) => v.start.r === r && v.start.c === c);
                const gi = puzzle.vehicles.findIndex((v) => v.goal.r === r && v.goal.c === c);
                const onPath = previewSet.has(k);
                const fence = board[k];
                return (
                  <Pressable
                    key={k}
                    onPress={() => tap(r, c)}
                    style={{
                      width: cell,
                      height: cell,
                      margin: 2,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      backgroundColor:
                        vi >= 0 ? "#CCFBF1" : gi >= 0 ? "#FFEDD5" : onPath ? "#FEF3C7" : "#FFFFFF",
                    }}
                  >
                    {vi >= 0 ? (
                      <Text style={{ fontSize: cell * 0.4 }}>
                        {puzzle.vehicles[vi].emoji}
                        {DIR_ARROW[puzzle.vehicles[vi].start.dir]}
                      </Text>
                    ) : gi >= 0 ? (
                      <Text style={{ fontSize: cell * 0.5 }}>{puzzle.vehicles[gi].customer}</Text>
                    ) : fence ? (
                      <FenceMark kind={fence} size={cell} />
                    ) : (
                      <Text style={{ fontSize: cell * 0.4, color: "#CBD5E1" }}>✕</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <Text className="text-[11px] text-muted mt-2">
          칸을 누르면 / → \ → 제거 순으로 바뀝니다 (장애물 없음)
        </Text>

        <View className="flex-row gap-2 mt-3 w-full">
          <View className="flex-1">
            <PrimaryButton
              variant="ghost"
              label="전체 초기화"
              onPress={() => {
                setBoard({});
                setPreview([]);
              }}
            />
          </View>
          <View className="flex-1">
            <PrimaryButton label="제출" onPress={submit} />
          </View>
        </View>
      </View>
    </GameShell>
  );
}

function Counter({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View
      className="flex-1 rounded-2xl bg-white px-3 py-2"
      style={{ borderWidth: 1, borderColor: accent ? "#F87171" : "#E7DDD8" }}
    >
      <Text className="text-[11px] text-muted">{label}</Text>
      <Text className="text-lg font-bold" style={{ color: accent ? "#B91C1C" : "#3D2C2E" }}>
        {value}
      </Text>
    </View>
  );
}

function FenceMark({ kind, size }: { kind: Fence; size: number }) {
  return (
    <View
      style={{
        width: size * 0.78,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#0F9D74",
        transform: [{ rotate: kind === "/" ? "-45deg" : "45deg" }],
      }}
    />
  );
}
