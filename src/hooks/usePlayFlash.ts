import { useCallback, useRef, useState } from "react";

export type PlayFlash = { kind: "ok" | "bad"; text: string };

export function usePlayFlash(holdMs = 1400) {
  const [flash, setFlash] = useState<PlayFlash | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: PlayFlash) => {
      setFlash(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(null), holdMs);
    },
    [holdMs]
  );

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setFlash(null);
  }, []);

  return { flash, show, clear };
}
