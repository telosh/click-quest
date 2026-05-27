import { MAX_EQUIPPED_ITEMS } from "../config";
import type { GameState, RewardChoice, RewardKind, RewardRank } from "../types";
import { getItem, getItemsForStage } from "./items";
import {
  BONUS_TIME_BY_RANK,
  INSTANT_BOOST_BY_RANK,
  ITEM_RANK,
  LUCKY_UP_BY_RANK,
  POWER_UP_BY_RANK,
  REWARD_KIND_LABEL,
  rollRewardRank,
} from "./rewardRanks";

const REWARD_CHOICE_COUNT = 3;

type PoolEntry =
  | { poolKey: string; kind: "item"; itemId: string }
  | { poolKey: string; kind: Exclude<RewardKind, "item"> };

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function stageBonusMs(stageIndex: number): number {
  return Math.min(stageIndex * 500, 10_000);
}

function buildRewardPool(stageIndex: number, state: GameState): PoolEntry[] {
  const pool: PoolEntry[] = [
    { poolKey: "instantBoost", kind: "instantBoost" },
    { poolKey: "bonusTime", kind: "bonusTime" },
    { poolKey: "powerUp", kind: "powerUp" },
    { poolKey: "luckyUp", kind: "luckyUp" },
  ];

  const canEquip = state.equippedItemIds.length < MAX_EQUIPPED_ITEMS;
  if (canEquip) {
    for (const item of getItemsForStage(stageIndex)) {
      if (state.equippedItemIds.includes(item.id)) continue;
      pool.push({ poolKey: `item:${item.id}`, kind: "item", itemId: item.id });
    }
  }

  return pool;
}

function createItemReward(
  stageIndex: number,
  itemId: string,
  rank: RewardRank,
): RewardChoice {
  const item = getItem(itemId);
  if (!item) {
    throw new Error(`Unknown item: ${itemId}`);
  }

  return {
    id: `item-${itemId}-${stageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "item",
    rank,
    label: REWARD_KIND_LABEL.item,
    variantLabel: item.name,
    description: item.description,
    iconKey: item.id,
    itemId: item.id,
    stageIndex,
  };
}

function createInstantBoostReward(
  stageIndex: number,
  power: number,
  rank: RewardRank,
): RewardChoice {
  const spec = INSTANT_BOOST_BY_RANK[rank];
  const stageScale = 1 + Math.min(stageIndex * 0.04, 0.6);
  const instantGain = Math.floor(power * spec.powerMult * stageScale);

  return {
    id: `boost-${rank}-${stageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "instantBoost",
    rank,
    label: REWARD_KIND_LABEL.instantBoost,
    variantLabel: spec.variant,
    description: `+${instantGain.toLocaleString("ja-JP")} クリック分を一括獲得`,
    iconKey: "instantBoost",
    instantGain,
    stageIndex,
  };
}

function createBonusTimeReward(stageIndex: number, rank: RewardRank): RewardChoice {
  const spec = BONUS_TIME_BY_RANK[rank];
  const duration = spec.durationMs + stageBonusMs(stageIndex);

  return {
    id: `bonus-${rank}-${stageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "bonusTime",
    rank,
    label: REWARD_KIND_LABEL.bonusTime,
    variantLabel: spec.variant,
    description: `${Math.round(duration / 1000)}秒間 ×${spec.multiplier} 獲得`,
    iconKey: "bonusTime",
    bonusDurationMs: duration,
    bonusMultiplier: spec.multiplier,
    stageIndex,
  };
}

function createPowerUpReward(stageIndex: number, rank: RewardRank): RewardChoice {
  const spec = POWER_UP_BY_RANK[rank];
  const powerGain = spec.power + Math.floor(stageIndex / 4);

  return {
    id: `power-${rank}-${stageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "powerUp",
    rank,
    label: REWARD_KIND_LABEL.powerUp,
    variantLabel: spec.variant,
    description: `Power +${powerGain.toLocaleString("ja-JP")}（永続）`,
    iconKey: "powerUp",
    powerGain,
    stageIndex,
  };
}

function createLuckyUpReward(stageIndex: number, rank: RewardRank): RewardChoice {
  const spec = LUCKY_UP_BY_RANK[rank];
  const luckyGain = spec.lucky + Math.min(stageIndex * 0.001, 0.01);

  return {
    id: `lucky-${rank}-${stageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "luckyUp",
    rank,
    label: REWARD_KIND_LABEL.luckyUp,
    variantLabel: spec.variant,
    description: `Lucky Chance +${(luckyGain * 100).toFixed(1)}%（永続）`,
    iconKey: "luckyUp",
    luckyGain,
    stageIndex,
  };
}

function materializeReward(
  entry: PoolEntry,
  stageIndex: number,
  state: GameState,
): RewardChoice {
  if (entry.kind === "item") {
    const rank = ITEM_RANK[entry.itemId] ?? "B";
    return createItemReward(stageIndex, entry.itemId, rank);
  }

  const rank = rollRewardRank();

  switch (entry.kind) {
    case "instantBoost":
      return createInstantBoostReward(stageIndex, state.power, rank);
    case "bonusTime":
      return createBonusTimeReward(stageIndex, rank);
    case "powerUp":
      return createPowerUpReward(stageIndex, rank);
    case "luckyUp":
      return createLuckyUpReward(stageIndex, rank);
  }
}

/** 同種ボーナス（instantBoost / bonusTime 等）は1枠のみ。3枠はプールから完全ランダム抽選 */
export function buildRewardChoices(stageIndex: number, state: GameState): RewardChoice[] {
  const pool = buildRewardPool(stageIndex, state);
  const selected = shuffle(pool).slice(0, REWARD_CHOICE_COUNT);
  return selected.map((entry) => materializeReward(entry, stageIndex, state));
}

export function buildRewardQueue(stageIndices: number[], state: GameState): RewardChoice[] {
  return stageIndices.flatMap((stageIndex) => buildRewardChoices(stageIndex, state));
}
