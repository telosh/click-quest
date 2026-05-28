export type RewardKind =
  | "item"
  | "bonusTime"
  | "instantBoost"
  | "powerUp"
  | "luckyUp"
  | "pact";
export type RewardRank = "C" | "B" | "A" | "S";

/** アイテムの成長方針（UI表示・バランス分類用） */
export type ItemCategory =
  | "power"
  | "lucky"
  | "passive"
  | "combo"
  | "bonus"
  | "input"
  | "hybrid"
  | "pact";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  minStage: number;
  category: ItemCategory;
  powerMult?: number;
  /** 乗算補正からの減算（0.4 → 合計倍率 -40% 分） */
  powerMultPenalty?: number;
  /** ベース Power の上限（1 で常に1扱い） */
  powerCap?: number;
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

/** 報酬で付与される永続契約（装備アイテムとは別） */
export interface PermanentPact {
  label: string;
  powerCap: number | null;
  luckyBonus: number;
  powerDelta: number;
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
  /** 契約報酬: ベース Power 上限 */
  powerCap?: number;
  stageIndex: number;
}

export interface GameState {
  saveVersion: number;
  totalClicks: number;
  stageIndex: number;
  power: number;
  /** 永続契約（報酬の pact）。null なら未契約 */
  permanentPact: PermanentPact | null;
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
