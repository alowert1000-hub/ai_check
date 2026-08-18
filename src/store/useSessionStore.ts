import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GamePlayPayload, HistoryItem } from "@/src/types/game";

type SessionState = {
  lastResult: GamePlayPayload | null;
  history: HistoryItem[];
  finish: (payload: GamePlayPayload) => void;
  clearLast: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      lastResult: null,
      history: [],
      finish: (payload) =>
        set((state) => ({
          lastResult: payload,
          history: [
            {
              gameId: payload.gameId,
              gameTitle: payload.gameTitle,
              accuracy: payload.accuracy,
              avgReactionMs: payload.avgReactionMs,
              playedAt: payload.finishedAt,
            },
            ...state.history,
          ].slice(0, 30),
        })),
      clearLast: () => set({ lastResult: null }),
    }),
    {
      name: "aicheck-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ history: s.history, lastResult: s.lastResult }),
    }
  )
);
