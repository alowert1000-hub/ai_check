import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SpeakerIcon } from "../components/icons.jsx";
import { BackButton, Button, MicButton, PhoneShell, QuestionSkeleton } from "../components/ui.jsx";
import { useInterview } from "../context/InterviewContext.jsx";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/useSpeech.js";
import { nextQuestion } from "../lib/ai.js";
import { formatClock } from "../lib/dates.js";
import { QUESTION_BANK, getResume, getWorkMode, setWorkMode, timeLimitSec } from "../lib/store.js";

export function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resume = getResume()?.content || "";
  const { session, startSession, setAnswer, patchSession } = useInterview();
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const [loading, setLoading] = useState(!session?.question);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState(session?.answer || "");
  const [usedMic, setUsedMic] = useState(false);
  const [remain, setRemain] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const submitting = useRef(false);
  const liveText = useRef("");
  const liveMic = useRef(false);

  useEffect(() => {
    if (!resume) navigate("/resume", { replace: true, state: { next: "/interview" } });
  }, [navigate, resume]);

  useEffect(() => {
    let cancelled = false;
    if (!resume || session?.question) {
      setLoading(false);
      return undefined;
    }
    nextQuestion(resume)
      .then((item) => {
        if (!cancelled) {
          startSession(item);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resume, session?.question, startSession]);

  useEffect(() => {
    if (speech.transcript) setDraft(speech.transcript);
  }, [speech.transcript]);

  const combined = [draft, speech.listening ? speech.interim : ""].filter(Boolean).join(" ");
  liveText.current = combined;
  liveMic.current = usedMic || speech.listening;

  const question = session?.question || "";
  const trackKey = session?.trackKey || "open";
  const isIntro = trackKey === "intro";
  const isFollowup = session?.questionType === "followup" || trackKey === "followup";
  const workMode = session?.workMode;
  const limit = timeLimitSec({ trackKey, workMode, speechSupported: speech.supported });
  const bankTotal = session?.bankTotal || QUESTION_BANK.length;
  const bankDone = session?.bankDoneToday ?? 0;
  const badge = isFollowup
    ? "꼬리질문 · 자기소개서"
    : session?.cycled
      ? `질문 은행 복습 · ${bankTotal}/${bankTotal}`
      : `질문 은행 ${Math.min(bankDone + 1, bankTotal)}/${bankTotal}`;

  useEffect(() => {
    if (!session?.question || loading) return undefined;
    const timer = setTimeout(() => tts.speak(session.question), 280);
    return () => {
      clearTimeout(timer);
      tts.stop();
    };
  }, [session?.question, loading, tts.speak, tts.stop]);

  useEffect(() => {
    if (!workMode || !session?.timerStartedAt || !limit) {
      setRemain(null);
      return undefined;
    }
    const tick = () => {
      const passed = Math.floor((Date.now() - session.timerStartedAt) / 1000);
      setElapsed(passed);
      setRemain(Math.max(0, limit - passed));
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [workMode, session?.timerStartedAt, limit]);

  const submit = (timedOut = false) => {
    if (submitting.current) return;
    submitting.current = true;
    const text = liveText.current.trim() || (timedOut ? "시간 안에 답변하지 못했습니다." : "");
    if (!timedOut && text.length < 8) {
      submitting.current = false;
      speech.setError("답변을 조금 더 말한 뒤 피드백을 받아 주세요.");
      return;
    }
    speech.stop();
    tts.stop();
    const duration = session?.timerStartedAt ? Math.floor((Date.now() - session.timerStartedAt) / 1000) : elapsed;
    setAnswer(text, liveMic.current ? "speech" : "text", {
      timedOut,
      durationSec: duration,
      timeLimitSec: limit || null,
      withinTime: !limit || duration <= limit,
      workMode,
    });
    navigate("/feedback");
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (remain === 0 && limit && workMode) submitRef.current(true);
  }, [remain, limit, workMode]);

  const chooseMode = (mode) => {
    setWorkMode(mode);
    const introVoice = trackKey === "intro" && speech.supported;
    patchSession({ workMode: mode, timerStartedAt: introVoice ? undefined : Date.now() });
  };

  useEffect(() => {
    if (!session?.question || session.workMode || loading) return;
    const saved = getWorkMode();
    if (!saved || !location.state?.reuseWorkMode) return;
    const introVoice = (session.trackKey || "open") === "intro" && speech.supported;
    setWorkMode(saved);
    patchSession({ workMode: saved, timerStartedAt: introVoice ? undefined : Date.now() });
  }, [session?.question, session?.workMode, session?.trackKey, loading, location.state, speech.supported, patchSession]);

  const startTimerIfNeeded = () => {
    if (!session?.timerStartedAt && limit) patchSession({ timerStartedAt: Date.now() });
  };

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    tts.stop();
    setUsedMic(true);
    startTimerIfNeeded();
    speech.start(draft);
  };

  const danger = remain !== null && remain <= 10;
  const warning = remain !== null && remain <= 30;

  return (
    <PhoneShell>
      <header className="flex items-center justify-between px-4 pt-[max(20px,env(safe-area-inset-top))]">
        <BackButton
          onClick={() => {
            speech.stop();
            tts.stop();
            navigate("/");
          }}
        />
        <p className="text-[14px] font-bold text-toss-text">모의면접</p>
        <span className="w-10" />
      </header>
      <main className="flex flex-1 flex-col px-5 pb-6 pt-4">
        {loading ? (
          <QuestionSkeleton />
        ) : (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[12px] font-bold text-toss-blue">
                  {badge}
                  {session?.questionSource === "mock" && isFollowup ? " · 체험" : ""}
                </p>
                {tts.supported && question && (
                  <button
                    type="button"
                    onClick={() => (tts.speaking ? tts.stop() : tts.speak(question))}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-toss-blue-soft px-2.5 py-1 text-[12px] font-bold text-toss-blue"
                    aria-label={tts.speaking ? "질문 읽기 중지" : "면접관처럼 질문 듣기"}
                  >
                    <SpeakerIcon speaking={tts.speaking} />
                    {tts.speaking ? "중지" : "다시 듣기"}
                  </button>
                )}
              </div>
              <h1 className="mt-2 text-[20px] font-extrabold leading-snug tracking-[-0.4px] text-toss-text">
                {question || loadError || "질문을 만들지 못했습니다."}
              </h1>
              {tts.supported && <p className="mt-2 text-[12px] font-medium text-toss-500">면접관이 질문을 읽어 줍니다.</p>}
              {session?.questionSource === "mock" && isFollowup && (
                <p className="mt-3 rounded-2xl bg-[#FFF6E6] px-3 py-2 text-[13px] leading-relaxed text-[#C27A00]">
                  OpenAI에 연결하지 못해 자기소개서 꼬리질문을 임시로 만들었어요.
                  {session.apiError ? ` (${session.apiError})` : " 설정에서 API 키를 저장해 주세요."}
                </p>
              )}
              {isFollowup ? (
                <p className="mt-3 rounded-2xl bg-toss-blue-soft px-3 py-2 text-[13px] leading-relaxed text-toss-blue">
                  자기소개서를 다른 시선으로 찌르는 꼬리질문입니다. 이어서 질문 은행 3문항이 나옵니다.
                </p>
              ) : session?.cycled ? (
                <p className="mt-3 rounded-2xl bg-toss-blue-soft px-3 py-2 text-[13px] leading-relaxed text-toss-blue">
                  오늘 질문 은행 {bankTotal}문항을 모두 풀었습니다. 이제 복습이거나 자기소개서 꼬리질문입니다.
                </p>
              ) : (
                <p className="mt-3 rounded-2xl bg-toss-blue-soft px-3 py-2 text-[13px] leading-relaxed text-toss-blue">
                  꼬리질문 1개 다음에 질문 은행 3개가 순환됩니다. 오늘 남은 은행 문항 {Math.max(0, (session?.bankRemainingToday ?? bankTotal) - 1)}개.
                </p>
              )}
            </section>
            {workMode ? (
              <>
                {isIntro && speech.supported && !session?.timerStartedAt && (
                  <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                    <p className="text-[12px] font-bold text-toss-500">1분 자기소개 타이머</p>
                    <p className="mt-2 text-[28px] font-extrabold tracking-[-1px] text-toss-text">01:00</p>
                    <p className="mt-2 text-[13px] text-toss-600">마이크를 누르거나 입력을 시작하면 1분이 가고, 끝나면 자동으로 넘어갑니다.</p>
                  </section>
                )}
                {limit > 0 && remain !== null && (
                  <section className={`mt-4 rounded-2xl p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)] ${danger ? "bg-[#FFF1F1]" : "bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-toss-500">{isIntro && speech.supported ? "1분 자기소개 타이머" : "답변 시간"}</p>
                      <p className={`text-[28px] font-extrabold tracking-[-1px] ${danger ? "text-toss-red" : warning ? "text-[#C27A00]" : "text-toss-text"}`}>
                        {formatClock(remain)}
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-toss-200">
                      <div className={`h-full rounded-full transition-all ${danger ? "bg-toss-red" : "bg-toss-blue"}`} style={{ width: `${Math.max(0, (remain / limit) * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[13px] text-toss-600">
                      {isIntro && speech.supported
                        ? session?.timerStartedAt
                          ? "1분 안에 말하는지 재는 타이머입니다. 끝나기 전에 제출해도 됩니다."
                          : "마이크를 누르거나 입력을 시작하면 1분이 갑니다."
                        : "4분이 되면 자동 제출됩니다. 기다릴 필요 없이 지금 제출해도 바로 피드백으로 갑니다."}
                    </p>
                  </section>
                )}
                {workMode === "work" && !(isIntro && speech.supported) && (
                  <p className="mt-3 text-[13px] font-medium text-toss-500">업무 중이라 자동 종료는 없습니다. 준비가 되면 직접 제출해 주세요.</p>
                )}
                {workMode && (
                  <button type="button" className="mt-3 text-[13px] font-bold text-toss-blue" onClick={() => patchSession({ workMode: "", timerStartedAt: undefined })}>
                    {workMode === "work" ? "업무 중" : "업무 아님"} · 바꾸기
                  </button>
                )}
                <section className="mt-4 min-h-[180px] flex-1 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-bold text-toss-500">실시간 받아쓰기</p>
                    <span className="text-[12px] font-semibold text-toss-blue">{workMode === "work" ? "업무 중" : "업무 아님"}</span>
                  </div>
                  <textarea
                    value={combined}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      speech.setTranscript(event.target.value);
                      if (event.target.value.trim()) startTimerIfNeeded();
                    }}
                    placeholder="마이크를 누르거나, 여기에 직접 답변을 입력하세요."
                    className="h-[150px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-toss-text outline-none placeholder:text-toss-400"
                  />
                  {!speech.supported && (
                    <p className="mt-2 text-[13px] font-medium text-toss-600">이 브라우저는 음성 인식을 지원하지 않아 텍스트로 진행할 수 있어요.</p>
                  )}
                  {(speech.error || loadError) && <p className="mt-2 text-[13px] font-semibold text-toss-red">{speech.error || loadError}</p>}
                </section>
                <div className="mt-8 flex flex-col items-center">
                  <MicButton listening={speech.listening} onToggle={toggleMic} />
                </div>
                <div className="mt-8">
                  <Button onClick={() => submit(false)} disabled={!combined.trim()}>
                    지금 제출하고 피드백 받기
                  </Button>
                  <p className="mt-2 text-center text-[12px] font-medium text-toss-500">타이머가 끝날 때까지 기다리지 않아도 됩니다.</p>
                </div>
              </>
            ) : (
              <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                <p className="text-[16px] font-extrabold tracking-[-0.3px] text-toss-text">지금 업무 중이신가요?</p>
                <p className="mt-2 text-[14px] leading-relaxed text-toss-600">
                  업무 중이 아니면 답변은 최대 4분입니다. 그 전에 제출하면 바로 피드백으로 넘어갑니다.
                  {isIntro && speech.supported ? " 1분 자기소개는 음성 인식이 되면 1분 타이머로 끝냅니다." : ""}
                </p>
                <div className="mt-5 space-y-3">
                  <Button variant={getWorkMode() === "work" ? "primary" : "secondary"} onClick={() => chooseMode("work")}>
                    업무 중 · 시간 제한 없이 제출
                  </Button>
                  <Button variant={getWorkMode() === "free" ? "primary" : "secondary"} onClick={() => chooseMode("free")}>
                    업무 아님 · 4분 안에 제출 (언제든 가능)
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </PhoneShell>
  );
}
