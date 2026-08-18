import { useEffect, useRef, useState } from "react";

export function useCountdown(
  active: boolean,
  durationMs: number,
  onDone: () => void,
  resetKey: number | string = 0
) {
  const [remaining, setRemaining] = useState(durationMs);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const fired = useRef(false);

  useEffect(() => {
    if (!active) return;
    fired.current = false;
    setRemaining(durationMs);
    const started = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, durationMs - (Date.now() - started));
      setRemaining(left);
      if (left <= 0 && !fired.current) {
        fired.current = true;
        clearInterval(id);
        doneRef.current();
      }
    }, 50);
    return () => clearInterval(id);
  }, [active, durationMs, resetKey]);

  return remaining;
}
