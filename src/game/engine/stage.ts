import { GOAL_CLICKS, MAX_LUCKY_CHANCE } from "../config";
import type { GameState, RewardChoice } from "../types";
import { getNewStageIndices, getStageGrowth, getStageIndex } from "../data/stages";
import { buildRewardQueue } from "../data/rewards";
import {
  applyBonusTime,
  canEquipItem,
  createInitialState,
  isCleared,
  resolveClickGain,
  updateCombo,
} from "./click";

export function applyStageGrowth(state: GameState, stageIndex: number): GameState {
  const growth = getStageGrowth(stageIndex);
  return {
    ...state,
    power: state.power + growth.power,
    luckyChance: Math.min(MAX_LUCKY_CHANCE, state.luckyChance + growth.lucky),
  };
}

export function processStageUps(state: GameState, previousStageIndex: number): GameState {
  const newStageIndices = getNewStageIndices(previousStageIndex, state.totalClicks);
  if (newStageIndices.length === 0) {
    return { ...state, stageIndex: getStageIndex(state.totalClicks) };
  }

  let next = { ...state, stageIndex: getStageIndex(state.totalClicks) };
  for (const stageIndex of newStageIndices) {
    next = applyStageGrowth(next, stageIndex);
  }

  const rewards = buildRewardQueue(newStageIndices, next);
  return {
    ...next,
    pendingRewardQueue: [...next.pendingRewardQueue, ...rewards],
  };
}

export function applyClickGain(
  state: GameState,
  gain: number,
  options?: { updateCombo?: boolean; now?: number },
): GameState {
  if (gain <= 0 || isCleared(state)) return state;

  const now = options?.now ?? Date.now();
  const base = options?.updateCombo ? updateCombo(state, now) : state;
  const previousStage = base.stageIndex;
  const totalClicks = Math.min(base.totalClicks + gain, GOAL_CLICKS);

  let next: GameState = {
    ...base,
    totalClicks,
    cleared: totalClicks >= GOAL_CLICKS,
  };

  return processStageUps(next, previousStage);
}

export function performClick(state: GameState, now = Date.now()): {
  state: GameState;
  gain: number;
  isLucky: boolean;
} {
  if (isCleared(state)) {
    return { state, gain: 0, isLucky: false };
  }

  const withCombo = updateCombo(state, now);
  const { gain, isLucky } = resolveClickGain(withCombo);
  const next = applyClickGain(withCombo, gain);
  return { state: next, gain, isLucky };
}

export function performClickBurst(
  state: GameState,
  count: number,
  now = Date.now(),
): { state: GameState; gain: number; isLucky: boolean } {
  if (count <= 0 || isCleared(state)) {
    return { state, gain: 0, isLucky: false };
  }

  let next = state;
  let totalGain = 0;
  let isLucky = false;

  for (let i = 0; i < count; i += 1) {
    const result = performClick(next, now);
    if (result.gain <= 0) break;
    next = result.state;
    totalGain += result.gain;
    isLucky = isLucky || result.isLucky;
  }

  return { state: next, gain: totalGain, isLucky };
}

export function applyPassiveGain(state: GameState, gain: number): GameState {
  return applyClickGain(state, gain, { updateCombo: false });
}

export function applyReward(state: GameState, reward: RewardChoice): GameState {
  let next = { ...state };

  if (reward.kind === "item" && reward.itemId && canEquipItem(next, reward.itemId)) {
    next.equippedItemIds = [...next.equippedItemIds, reward.itemId];
  }

  if (reward.kind === "bonusTime" && reward.bonusDurationMs && reward.bonusMultiplier) {
    next = applyBonusTime(next, reward.bonusDurationMs, reward.bonusMultiplier);
  }

  if (reward.kind === "instantBoost" && reward.instantGain) {
    const previousStage = next.stageIndex;
    const newTotal = Math.min(next.totalClicks + reward.instantGain, GOAL_CLICKS);
    next = {
      ...next,
      totalClicks: newTotal,
      cleared: newTotal >= GOAL_CLICKS,
    };
    next = processStageUps(next, previousStage);
  }

  if (reward.kind === "powerUp" && reward.powerGain) {
    next = { ...next, power: next.power + reward.powerGain };
  }

  if (reward.kind === "luckyUp" && reward.luckyGain) {
    next = {
      ...next,
      luckyChance: Math.min(MAX_LUCKY_CHANCE, next.luckyChance + reward.luckyGain),
    };
  }

  next.pendingRewardQueue = next.pendingRewardQueue.filter(
    (entry) => entry.stageIndex !== reward.stageIndex,
  );
  return next;
}

export function resetGame(): GameState {
  return createInitialState();
}

export { createInitialState } from "./click";
export { getStageIndex, getNextThreshold } from "../data/stages";
