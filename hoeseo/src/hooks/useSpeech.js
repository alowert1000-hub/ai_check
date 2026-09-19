import { useCallback, useEffect, useRef, useState } from "react";

function SpeechCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition() {
  const recRef = useRef(null);
  const liveRef = useRef(false);
  const textRef = useRef("");
  const [supported] = useState(() => !!SpeechCtor());
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    liveRef.current = false;
    setListening(false);
    setInterim("");
    const rec = recRef.current;
    if (rec) {
      try {
        rec.onend = null;
        rec.stop();
      } catch {}
    }
  }, []);

  const start = useCallback((seed = "") => {
    const Ctor = SpeechCtor();
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. 아래에 직접 입력해 주세요.");
      return false;
    }
    setError("");
    textRef.current = seed.trim();
    liveRef.current = true;
    setListening(true);
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      let finals = "";
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (result.isFinal) finals += text;
        else live += text;
      }
      if (finals) {
        const prefix = textRef.current ? `${textRef.current} ` : "";
        textRef.current = `${prefix}${finals}`.replace(/\s+/g, " ").trim();
        setTranscript(textRef.current);
      }
      setInterim(live);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해 주세요.");
        liveRef.current = false;
        setListening(false);
        return;
      }
      if (event.error === "no-speech") {
        setError("음성이 감지되지 않았습니다. 조금 더 가까이에서 말해 주세요.");
        return;
      }
      if (event.error !== "aborted") {
        setError("음성 인식 중 문제가 생겼습니다. 다시 시도하거나 직접 입력해 주세요.");
      }
    };
    rec.onend = () => {
      if (liveRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      return true;
    } catch {
      setError("음성 인식을 시작할 수 없습니다. 직접 입력으로 진행해 주세요.");
      setListening(false);
      return false;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, transcript, interim, error, setTranscript, setError, start, stop };
}

function koreanVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((item) => item.lang === "ko-KR") || voices.find((item) => item.lang?.startsWith("ko")) || null;
}

export function useSpeechSynthesis() {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      utterRef.current = null;
      setSpeaking(false);
    }
  }, [supported]);

  const speak = useCallback(
    (text) => {
      const value = String(text || "").trim();
      if (!supported || !value) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(value);
      utter.lang = "ko-KR";
      utter.rate = 0.92;
      utter.pitch = 1;
      const voice = koreanVoice();
      if (voice) utter.voice = voice;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => {
        utterRef.current = null;
        setSpeaking(false);
      };
      utter.onerror = () => {
        utterRef.current = null;
        setSpeaking(false);
      };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [supported],
  );

  useEffect(() => {
    if (!supported) return undefined;
    const onVoices = () => koreanVoice();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    onVoices();
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, speak, stop };
}
