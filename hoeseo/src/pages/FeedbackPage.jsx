import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FeedbackCard, FeedbackSkeleton, PhoneShell, ScoreChart } from "../components/ui.jsx";
import { useInterview } from "../context/InterviewContext.jsx";
import { scoreAnswer } from "../lib/ai.js";
import { dateKey } from "../lib/dates.js";
import { getRecords, getResume, historyForRecord, saveRecord, syncTodayBriefing, trackLabel } from "../lib/store.js";

const savedIds = new Set();

function scorePath(scores) {
  return scores.map((score) => `${score}점`).join(" → ");
}

export function FeedbackPage() {
  const navigate = useNavigate();
  const { session, setFeedback, resetSession, startSession } = useInterview();
  const [loading, setLoading] = useState(!session?.feedback);
  const [error, setError] = useState("");
  const feedback = session?.feedback;
  const history = historyForRecord({ question: session?.question, trackKey: session?.trackKey });
  const scores = history.map((item) => item.score || 0);
  const label = trackLabel(session?.trackKey);

  useEffect(() => {
    if (!session?.question || !session?.answer) navigate("/interview", { replace: true });
  }, [navigate, session]);

  useEffect(() => {
    let cancelled = false;
    if (!session?.question || !session?.answer || session.feedback) {
      setLoading(false);
      return undefined;
    }
    scoreAnswer({
      question: session.question,
      answer: session.answer,
      resumeText: getResume()?.content,
      inputMode: session.inputMode || "text",
      durationSec: session.durationSec,
      timeLimitSec: session.timeLimitSec,
      timedOut: session.timedOut,
      preparedAnswer: session.preparedAnswer || "",
      preparedKeywords: session.preparedKeywords || [],
    })
      .then((result) => {
        if (cancelled) return;
        setFeedback(result);
        const id = `rec-${session.startedAt}`;
        if (!savedIds.has(id) && !getRecords().some((item) => item.id === id)) {
          savedIds.add(id);
          saveRecord({
            id,
            date: dateKey(new Date()),
            createdAt: new Date().toISOString(),
            question: session.question,
            answer: session.answer,
            questionType: session.questionType,
            trackKey: session.trackKey || "open",
            category: session.category || "",
            bankId: session.bankId || "",
            questionSource: session.questionSource,
            score: result.score,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            deduction_details: result.deduction_details,
            feedback_habits: result.feedback_habits,
            feedback_content: result.feedback_content,
            model_answer: result.model_answer,
            missing_points: result.missing_points,
            sentence_rewrites: result.sentence_rewrites,
            keywords: result.keywords,
            mindmap: result.mindmap,
            inputMode: session.inputMode,
            durationSec: session.durationSec,
            timeLimitSec: session.timeLimitSec,
            timedOut: session.timedOut,
            withinTime: session.withinTime,
            workMode: session.workMode,
            source: result.source,
            apiError: result.apiError,
          });
          syncTodayBriefing();
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "피드백을 만들지 못했습니다.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session, setFeedback]);

  const nextQuestion = () => {
    resetSession();
    navigate("/interview", { replace: true, state: { reuseWorkMode: true } });
  };

  const retry = () => {
    startSession({
      question: session.question,
      source: session.questionSource || "bank",
      questionType: session.questionType,
      trackKey: session.trackKey || "open",
      category: session.category || "",
      preparedAnswer: session.preparedAnswer || "",
      preparedKeywords: session.preparedKeywords || [],
      bankId: session.bankId || "",
    });
    navigate("/interview", { replace: true });
  };

  const timeNote =
    session?.trackKey === "intro" && session?.timeLimitSec === 60
      ? session.withinTime
        ? `1분 안에 마쳤습니다 (${session.durationSec || 0}초)`
        : `1분을 넘겼습니다 (${session.durationSec || 0}초)`
      : session?.timedOut
        ? "시간이 끝나 자동 제출되었습니다"
        : "";

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-8">
        {loading ? (
          <FeedbackSkeleton />
        ) : error ? (
          <div className="pt-20 text-center">
            <p className="text-[18px] font-bold text-toss-text">피드백을 만들지 못했어요</p>
            <p className="mt-2 text-[14px] text-toss-500">{error}</p>
            <div className="mt-6">
              <Button onClick={() => navigate("/interview")}>다시 시도</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[14px] font-semibold text-toss-blue">결과</p>
            <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">이번 답변은 {feedback?.score}점이에요</h1>
            <p className="mt-2 text-[14px] text-toss-600">잘한 점과 못한 점은 이번 실행 답변만 봤습니다. 빠진 내용과 문장 다듬기는 모범 답안 기준입니다.</p>
            {timeNote && <p className="mt-2 text-[14px] font-semibold text-toss-blue">{timeNote}</p>}
            {scores.length >= 2 && (
              <section className="mt-5 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                <p className="text-[13px] font-bold text-toss-500">이 질문 성장 곡선</p>
                <p className="mt-1 text-[14px] font-bold text-toss-text">{label || session?.question}</p>
                <p className="mt-1 text-[13px] text-toss-600">
                  {history.length}회 · {scorePath(scores)}
                </p>
                <div className="mt-2">
                  <ScoreChart scores={scores} />
                </div>
              </section>
            )}
            <div className="mt-5">
              <FeedbackCard
                score={feedback?.score}
                strengths={feedback?.strengths}
                weaknesses={feedback?.weaknesses}
                deduction_details={feedback?.deduction_details}
                feedback_habits={feedback?.feedback_habits}
                feedback_content={feedback?.feedback_content}
                model_answer={feedback?.model_answer}
                missing_points={feedback?.missing_points}
                sentence_rewrites={feedback?.sentence_rewrites}
                keywords={feedback?.keywords}
                mindmap={feedback?.mindmap}
                question={session?.question}
                answer={session?.answer}
                source={feedback?.source}
                apiError={feedback?.apiError}
                fromQuestionBank={!!(session?.bankId || session?.preparedAnswer)}
              />
            </div>
            <div className="mt-8 space-y-3">
              <Button onClick={nextQuestion}>다음 질문</Button>
              <Button variant="secondary" onClick={retry}>
                이 질문 한 번 더 연습
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")}>
                홈으로 돌아가기
              </Button>
            </div>
          </>
        )}
      </main>
    </PhoneShell>
  );
}
