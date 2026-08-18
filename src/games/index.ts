import type { ComponentType } from "react";
import type { GameId } from "@/src/types/game";
import { AppointmentGame } from "@/src/games/AppointmentGame";
import { CatGame } from "@/src/games/CatGame";
import { CompareGame } from "@/src/games/CompareGame";
import { NbackGame } from "@/src/games/NbackGame";
import { NumbersGame } from "@/src/games/NumbersGame";
import { PathGame } from "@/src/games/PathGame";
import { PotionGame } from "@/src/games/PotionGame";
import { RotateGame } from "@/src/games/RotateGame";
import { RpsGame } from "@/src/games/RpsGame";

export const GAME_SCREENS: Record<GameId, ComponentType> = {
  rps: RpsGame,
  rotate: RotateGame,
  appointment: AppointmentGame,
  path: PathGame,
  potion: PotionGame,
  numbers: NumbersGame,
  nback: NbackGame,
  cat: CatGame,
  compare: CompareGame,
};
