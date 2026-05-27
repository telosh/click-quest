import type { RewardKind, RewardRank } from "../types";

export interface RewardRankDef {
  id: RewardRank;
  label: string;
  weight: number;
}

export const REWARD_RANKS: RewardRankDef[] = [
  { id: "C", label: "C", weight: 45 },
  { id: "B", label: "B", weight: 30 },
  { id: "A", label: "A", weight: 18 },
  { id: "S", label: "S", weight: 7 },
];

export function rollRewardRank(): RewardRank {
  const total = REWARD_RANKS.reduce((sum, rank) => sum + rank.weight, 0);
  let roll = Math.random() * total;
  for (const rank of REWARD_RANKS) {
    roll -= rank.weight;
    if (roll <= 0) return rank.id;
  }
  return "C";
}

/** 同種でも数値だけの上位互換にならないよう、ランクごとに役割を分ける */
export const INSTANT_BOOST_BY_RANK: Record<
  RewardRank,
  { variant: string; powerMult: number }
> = {
  C: { variant: "スパーク", powerMult: 280 },
  B: { variant: "サンダー", powerMult: 520 },
  A: { variant: "メテオ", powerMult: 880 },
  S: { variant: "ジャックポット", powerMult: 1600 },
};

export const BONUS_TIME_BY_RANK: Record<
  RewardRank,
  { variant: string; durationMs: number; multiplier: number }
> = {
  C: { variant: "スタンダード", durationMs: 25_000, multiplier: 2 },
  B: { variant: "ロング", durationMs: 42_000, multiplier: 2 },
  A: { variant: "ラッシュ", durationMs: 18_000, multiplier: 3 },
  S: { variant: "フィーバー", durationMs: 36_000, multiplier: 3.5 },
};

export const POWER_UP_BY_RANK: Record<RewardRank, { variant: string; power: number }> = {
  C: { variant: "微増", power: 3 },
  B: { variant: "強化", power: 8 },
  A: { variant: "大幅", power: 16 },
  S: { variant: "覚醒", power: 32 },
};

export const LUCKY_UP_BY_RANK: Record<RewardRank, { variant: string; lucky: number }> = {
  C: { variant: "微幸", lucky: 0.01 },
  B: { variant: "幸運", lucky: 0.02 },
  A: { variant: "強運", lucky: 0.035 },
  S: { variant: "天運", lucky: 0.05 },
};

export const ITEM_RANK: Record<string, RewardRank> = {
  ring: "B",
  clover: "B",
  pocketWatch: "C",
  tapStone: "B",
  metronome: "B",
  helper: "B",
  dice: "B",
  spaceKey: "A",
  ancientMap: "A",
  gloves: "A",
  conveyor: "A",
  hourglass: "A",
  farm: "A",
  megaphone: "A",
  crown: "S",
  rainbow: "S",
  amplifier: "A",
  star: "A",
  factory: "S",
};

export const REWARD_KIND_LABEL: Record<RewardKind, string> = {
  item: "装備",
  instantBoost: "即時ブースト",
  bonusTime: "ボーナスタイム",
  powerUp: "Power 強化",
  luckyUp: "Lucky 強化",
};
