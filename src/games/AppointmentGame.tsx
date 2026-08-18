import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MAP } from "@/src/constants/games";
import { GameShell } from "@/src/components/GameShell";
import { TimerBar } from "@/src/components/TimerBar";
import { MAP_CELLS, makeAppointmentSet, type AppointmentRound } from "@/src/games/logic/appointment";
import { useCountdown } from "@/src/hooks/useCountdown";
import { usePlayFlash } from "@/src/hooks/usePlayFlash";
import { useSessionStore } from "@/src/store/useSessionStore";
import type { TrialLog } from "@/src/types/game";
import { buzzBad, buzzOk } from "@/src/utils/haptics";
import { buildPayload } from "@/src/utils/stats";

const meta = GAME_MAP.appointment;
/** 각 사람의 선호는 이 시간 동안만 노출되고 즉시 사라진다. */
const REVEAL_MS = 1800;
const GAP_MS = 350;
/** 답을 고르는 시간도 제한된다. */
const ANSWER_MS = 8000;

type Phase = "reveal" | "gap" | "answer";

export function AppointmentGame() {
  const router = useRouter();
  const finish = useSessionStore((s) => s.finish);
  const rounds = useRef(makeAppointmentSet()).current;
  const [ready, setReady] = useState(false);
  const [ri, setRi] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [phase, setPhase] = useState<Phase>("reveal");
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const startedAt = useRef(Date.now());
  const askedAt = useRef(Date.now());
  const lock = useRef(false);
  const flash = usePlayFlash(2000);
  const round: AppointmentRound = rounds[ri];

  useEffect(() => {
    if (!ready) return;
    if (phase === "reveal") {
      const id = setTimeout(() => setPhase("gap"), REVEAL_MS);
      return () => clearTimeout(id);
    }
    if (phase === "gap") {
      const id = setTimeout(() => {
        if (reveal + 1 >= round.reveals.length) {
          askedAt.current = Date.now();
          setPhase("answer");
        } else {
          setReveal((v) => v + 1);
          setPhase("reveal");
        }
      }, GAP_MS);
      return () => clearTimeout(id);
    }
    return;
  }, [ready, phase, reveal, ri, round.reveals.length]);

  const answerLeft = useCountdown(
    ready && phase === "answer",
    ANSWER_MS,
    () => {
      if (phase !== "answer" || lock.current) return;
      choose(null, true);
    },
    ri
  );

  function choose(choice: string | null, timeout = false) {
    if (lock.current) return;
    lock.current = true;
    const correct = choice === round.answer;
    if (correct) buzzOk();
    else buzzBad();
    if (!correct) {
      flash.show({
        kind: "bad",
        text: timeout
          ? `시간 초과예요. 정답은 ${labelOf(round, round.answer)}. 소거법으로 기억할 양을 줄여보세요.`
          : round.kind === "bus"
            ? `여기선 '아무도 타지 않은 번호'가 답이에요. 정답은 ${round.answer}번. 등장한 번호를 쌓아가며 접근하세요.`
            : `정답은 ${labelOf(round, round.answer)}. 앞사람에게 없던 항목을 지워 나가는 소거법이 유리해요.`,
      });
    }
    const log: TrialLog = {
      index: ri,
      correct,
      timeout,
      reactionMs: Date.now() - askedAt.current,
      detail: `${round.title} · ${timeout ? "시간 초과" : `선택 ${labelOf(round, choice ?? "")}`}${
        correct ? "" : ` · 정답 ${labelOf(round, round.answer)}`
      }`,
    };
    const next = [...trials, log];
    setTimeout(
      () => {
        lock.current = false;
        if (ri + 1 >= rounds.length) {
          finish(
            buildPayload({
              gameId: "appointment",
              gameTitle: meta.title,
              startedAt: startedAt.current,
              trials: next,
              extra: {
                busMiss: next.some((t) => !t.correct && t.detail?.includes("버스")),
                lateRoundErrors: next.filter((t) => !t.correct && t.detail?.includes("후반")).length,
              },
            })
          );
          router.replace("/result");
          return;
        }
        setTrials(next);
        setRi((v) => v + 1);
        setReveal(0);
        setPhase("reveal");
      },
      correct ? 450 : 1400
    );
  }

  const card = round.reveals[reveal];
  const showing = phase !== "answer";

  return (
    <GameShell
      meta={meta}
      ready={ready}
      onReady={() => {
        startedAt.current = Date.now();
        askedAt.current = Date.now();
        setReady(true);
        setPhase("reveal");
      }}
      progressLabel={ready ? `${round.title} · 남은 문항 ${rounds.length - ri - 1}` : undefined}
      liveTip={
        round.kind === "bus"
          ? "정보가 스스로 사라집니다. 등장한 번호를 쌓아 두고, 마지막에 남는 번호를 고르세요."
          : "정보가 스스로 사라집니다. 앞사람에게 없던 항목을 지우는 소거법으로 기억할 양을 줄이세요."
      }
      flash={flash.flash}
    >
      <View className="flex-1">
        <Text className="text-center text-muted mb-2">{round.prompt}</Text>

        {showing ? (
          <View className="flex-1 justify-center">
            <View
              className="rounded-3xl bg-white p-6 items-center"
              style={{ borderWidth: 1, borderColor: "#E7DDD8" }}
            >
              <Text className="text-lg font-bold text-ink">
                {phase === "reveal" ? card.person.name : ""}
              </Text>
              {phase === "reveal" ? (
                round.kind === "map" ? (
                  <MapGrid marks={card.picks} />
                ) : (
                  <View className="flex-row flex-wrap justify-center gap-2 mt-4">
                    {card.picks.map((p) => (
                      <View
                        key={p}
                        className="rounded-2xl px-5 py-4"
                        style={{ backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" }}
                      >
                        <Text className="text-xl font-bold text-ink">
                          {round.kind === "bus" ? `${p}번` : p}
                        </Text>
                      </View>
                    ))}
                  </View>
                )
              ) : (
                <View className="items-center justify-center" style={{ height: 132 }}>
                  <Text className="text-3xl text-muted">…</Text>
                </View>
              )}
              <Text className="text-xs text-muted mt-4">
                {reveal + 1} / {round.reveals.length}명 · 기억해 두세요
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            <TimerBar ratio={answerLeft / ANSWER_MS} color="#7C3AED" />
            <Text className="text-center font-bold text-ink my-3">
              {round.kind === "map" ? "공통 위치를 선택하세요" : "정답을 선택하세요"}
            </Text>
            {round.kind === "map" ? (
              <View className="items-center">
                <MapGrid marks={[]} onSelect={(cell) => choose(String(cell))} />
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {round.choices.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => choose(c)}
                    className="rounded-2xl bg-white px-4 py-4 active:opacity-70"
                    style={{
                      minWidth: "47%",
                      flexGrow: 1,
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: "#E7DDD8",
                    }}
                  >
                    <Text className="text-lg font-bold text-ink">
                      {round.kind === "bus" ? `${c}번` : c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </GameShell>
  );
}

function labelOf(round: AppointmentRound, value: string): string {
  if (!value) return "무응답";
  if (round.kind === "map") {
    const n = Number(value);
    return `${Math.floor(n / 4) + 1}행 ${(n % 4) + 1}열`;
  }
  if (round.kind === "bus") return `${value}번`;
  return value;
}

function MapGrid({ marks, onSelect }: { marks: string[]; onSelect?: (cell: number) => void }) {
  const marked = new Set(marks.map(Number));
  return (
    <View className="mt-4">
      {Array.from({ length: 4 }, (_, r) => (
        <View key={r} className="flex-row">
          {Array.from({ length: 4 }, (_, c) => {
            const i = r * 4 + c;
            const on = marked.has(i);
            const Cell = onSelect ? Pressable : View;
            return (
              <Cell
                key={i}
                onPress={onSelect ? () => onSelect(i) : undefined}
                className="items-center justify-center m-0.5 rounded-lg"
                style={{
                  width: 54,
                  height: 54,
                  backgroundColor: on ? "#7C3AED" : "#F8FAFC",
                  borderWidth: 1,
                  borderColor: on ? "#6D28D9" : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 20 }}>{on ? "📍" : ""}</Text>
              </Cell>
            );
          })}
        </View>
      ))}
      <Text className="text-[11px] text-muted text-center mt-1">16등분 지도 ({MAP_CELLS}칸)</Text>
    </View>
  );
}
