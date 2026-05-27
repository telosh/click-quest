export type RewardKind = "item" | "bonusTime" | "instantBoost" | "powerUp" | "luckyUp";
export type RewardRank = "C" | "B" | "A" | "S";

/** アイテムの成長方針（UI表示・バランス分類用） */
export type ItemCategory =
  | "power"
  | "lucky"
  | "passive"
  | "combo"
  | "bonus"
  | "input"
  | "hybrid";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  minStage: number;
  category: ItemCategory;
  powerMult?: number;
  luckyBonus?: number;
  luckyMultBonus?: number;
  comboBonus?: number;
  /** コンボ継続ウィンドウの延長（ms） */
  comboWindowExtendMs?: number;
  bonusTimeExtendMs?: number;
  /** ボーナスタイム中の倍率加算（例: 0.35 → ×0.35 追加） */
  bonusTimeMultBonus?: number;
  spaceHold?: boolean;
  /** 長押しで自動タップ（スマホ向け） */
  touchHold?: boolean;
  /** 毎秒の自動クリック数 */
  passiveCps?: number;
  /** パッシブが Power の何割を毎秒加算するか */
  passivePowerScale?: number;
  /** ステージごとにパッシブ +N（floor(stageIndex * N)） */
  passiveStageBonus?: number;
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
  /** パッシブ収入の端数ミリ秒 */
  passiveAccumulatorMs: number;
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
