export type GameId =
  | "rps"
  | "rotate"
  | "appointment"
  | "path"
  | "potion"
  | "numbers"
  | "nback"
  | "cat"
  | "compare";

export type CompetencyKey = "performance" | "strategy" | "relation" | "adapt";

export type TrialLog = {
  index: number;
  correct: boolean;
  reactionMs: number;
  detail?: string;
  timeout?: boolean;
};

export type GamePlayPayload = {
  gameId: GameId;
  gameTitle: string;
  startedAt: number;
  finishedAt: number;
  totalTrials: number;
  correctCount: number;
  accuracy: number;
  avgReactionMs: number;
  timeoutCount: number;
  errorPatterns: string[];
  extra: Record<string, unknown>;
  trials: TrialLog[];
  competencies?: Record<CompetencyKey, number>;
};

export type HistoryItem = {
  gameId: GameId;
  gameTitle: string;
  accuracy: number;
  avgReactionMs: number;
  playedAt: number;
};

export type GameMeta = {
  id: GameId;
  title: string;
  emoji: string;
  subtitle: string;
  skill: string;
  evalArea: string;
  evalDesc: string;
  tool: string;
  competency: CompetencyKey;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tint: string;
  accent: string;
  summary: string;
  rules: string[];
  methods: string[];
  tips: string[];
  durationLabel: string;
};
