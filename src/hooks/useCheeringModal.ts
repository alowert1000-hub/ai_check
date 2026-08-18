import { useCallback, useState } from "react";
import { CHEERS } from "@/src/constants/cheers";
import type { GameId } from "@/src/types/game";
import { pick } from "@/src/utils/random";

export function useCheeringModal() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>(CHEERS[0]);
  const [pendingId, setPendingId] = useState<GameId | null>(null);

  const openFor = useCallback((id: GameId) => {
    setMessage(pick(CHEERS));
    setPendingId(id);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, message, pendingId, openFor, close };
}
