export type RewardKind = "item" | "bonusTime" | "instantBoost" | "powerUp" | "luckyUp";
export type RewardRank = "C" | "B" | "A" | "S";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  minStage: number;
  powerMult?: number;
  luckyBonus?: number;
  luckyMultBonus?: number;
  comboBonus?: number;
  bonusTimeExtendMs?: number;
}

export interface StageGrowth {
  power: number;
  lucky: number;
}

export interface RewardChoice {
  id: string;
  kind: RewardKind;
  rank: RewardRank;
  label: string;
  variantLabel: string;
  description: string;
  iconKey: string;
  itemId?: string;
  bonusDurationMs?: number;
  bonusMultiplier?: number;
  instantGain?: number;
  powerGain?: number;
  luckyGain?: number;
  stageIndex: number;
}

export interface GameState {
  saveVersion: number;
  totalClicks: number;
  stageIndex: number;
  power: number;
  luckyChance: number;
  equippedItemIds: string[];
  bonusTimeRemainingMs: number;
  bonusTimeMultiplier: number;
  pendingRewardQueue: RewardChoice[];
  cleared: boolean;
  lastClickAt: number;
  comboStreak: number;
}

export interface ClickResult {
  gain: number;
  isLucky: boolean;
  state: GameState;
}

export interface PopEvent {
  id: number;
  x: number;
  y: number;
  text: string;
  isLucky: boolean;
}
