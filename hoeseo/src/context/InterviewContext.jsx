import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getSession, sendYesterdayIfNeeded, setSession } from "../lib/store.js";

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => {
    sendYesterdayIfNeeded().catch(() => {});
  }, []);

  const replaceSession = useCallback((next) => {
    setSessionState(next);
    if (next) setSession(next);
    else clearSession();
  }, []);

  const startSession = useCallback(
    (input, source = "mock", questionType = "deep", apiError = "", trackKey = "open") => {
      const payload =
        input && typeof input === "object" && input.question
          ? input
          : { question: input, source, questionType, apiError, trackKey };
      replaceSession({
        question: payload.question,
        questionSource: payload.source || source,
        questionType: payload.questionType || questionType,
        apiError: payload.apiError || apiError || "",
        trackKey: payload.trackKey || trackKey,
        category: payload.category || "",
        preparedAnswer: payload.modelAnswer || payload.preparedAnswer || "",
        preparedKeywords: payload.keywords || payload.preparedKeywords || [],
        bankId: payload.bankId || "",
        bankDoneToday: payload.bankDoneToday,
        bankTotal: payload.bankTotal,
        bankRemainingToday: payload.bankRemainingToday,
        cycled: !!payload.cycled,
        answer: "",
        feedback: null,
        startedAt: Date.now(),
      });
    },
    [replaceSession],
  );

  const setAnswer = useCallback((answer, inputMode = "text", extra = {}) => {
    setSessionState((current) => {
      const next = current
        ? { ...current, answer, inputMode, ...extra }
        : { answer, inputMode, question: "", startedAt: Date.now(), ...extra };
      setSession(next);
      return next;
    });
  }, []);

  const patchSession = useCallback((extra) => {
    setSessionState((current) => {
      if (!current) return current;
      const next = { ...current, ...extra };
      setSession(next);
      return next;
    });
  }, []);

  const setFeedback = useCallback((feedback) => {
    setSessionState((current) => {
      if (!current) return current;
      const next = { ...current, feedback };
      setSession(next);
      return next;
    });
  }, []);

  const resetSession = useCallback(() => replaceSession(null), [replaceSession]);

  const value = useMemo(
    () => ({ session, startSession, setAnswer, setFeedback, resetSession, patchSession }),
    [session, startSession, setAnswer, setFeedback, resetSession, patchSession],
  );

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const value = useContext(InterviewContext);
  if (!value) throw new Error("useInterview must be used within InterviewProvider");
  return value;
}
