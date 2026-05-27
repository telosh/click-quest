import {
  BONUS_TIME_DEFAULT_MULT,
  COMBO_WINDOW_MS,
  GOAL_CLICKS,
  LUCKY_MULTIPLIER,
  MAX_EQUIPPED_ITEMS,
  MAX_LUCKY_CHANCE,
  PASSIVE_TICK_MS,
  SAVE_VERSION,
} from "../config";
import type { GameState } from "../types";
import { getItem } from "../data/items";

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    totalClicks: 0,
    stageIndex: 0,
    power: 1,
    luckyChance: 0.03,
    equippedItemIds: [],
    bonusTimeRemainingMs: 0,
    bonusTimeMultiplier: BONUS_TIME_DEFAULT_MULT,
    pendingRewardQueue: [],
    cleared: false,
    lastClickAt: 0,
    comboStreak: 0,
    passiveAccumulatorMs: 0,
  };
}

export function getItemPowerMultiplier(equippedItemIds: string[]): number {
  let mult = 1;
  for (const id of equippedItemIds) {
    const item = getItem(id);
    if (item?.powerMult) mult += item.powerMult;
  }
  return mult;
}

export function getItemLuckyBonus(equippedItemIds: string[]): number {
  let bonus = 0;
  for (const id of equippedItemIds) {
    const item = getItem(id);
    if (item?.luckyBonus) bonus += item.luckyBonus;
  }
  return bonus;
}

export function getItemLuckyMultBonus(equippedItemIds: string[]): number {
  let bonus = 0;
  for (const id of equippedItemIds) {
    const item = getItem(id);
    if (item?.luckyMultBonus) bonus += item.luckyMultBonus;
  }
  return bonus;
}

export function getComboBonus(state: GameState): number {
  let bonus = 0;
  for (const id of state.equippedItemIds) {
    const item = getItem(id);
    if (item?.comboBonus) {
      bonus = Math.max(bonus, item.comboBonus);
    }
  }
  if (bonus <= 0) return 0;
  return Math.min(bonus, bonus * (state.comboStreak / 10));
}

export function getEffectiveLuckyChance(state: GameState): number {
  return Math.min(
    MAX_LUCKY_CHANCE,
    state.luckyChance + getItemLuckyBonus(state.equippedItemIds),
  );
}

export function getEffectivePower(state: GameState): number {
  const combo = getComboBonus(state);
  return state.power * getItemPowerMultiplier(state.equippedItemIds) * (1 + combo);
}

export function getLuckyMultiplier(state: GameState): number {
  return LUCKY_MULTIPLIER * (1 + getItemLuckyMultBonus(state.equippedItemIds));
}

export function isBonusActive(state: GameState): boolean {
  return state.bonusTimeRemainingMs > 0;
}

export function getBonusMultiplier(state: GameState): number {
  return isBonusActive(state) ? state.bonusTimeMultiplier : 1;
}

export function updateCombo(state: GameState, now: number): GameState {
  if (state.lastClickAt > 0 && now - state.lastClickAt <= COMBO_WINDOW_MS) {
    return { ...state, comboStreak: Math.min(state.comboStreak + 1, 20), lastClickAt: now };
  }
  return { ...state, comboStreak: 1, lastClickAt: now };
}

export function resolveClickGain(state: GameState, random = Math.random()): {
  gain: number;
  isLucky: boolean;
} {
  const power = getEffectivePower(state);
  const isLucky = random < getEffectiveLuckyChance(state);
  let gain = power;
  if (isLucky) gain *= getLuckyMultiplier(state);
  gain *= getBonusMultiplier(state);
  return { gain: Math.max(1, Math.floor(gain)), isLucky };
}

export function applyBonusTime(
  state: GameState,
  durationMs: number,
  multiplier: number,
): GameState {
  let extendMs = durationMs;
  for (const id of state.equippedItemIds) {
    const item = getItem(id);
    if (item?.bonusTimeExtendMs) extendMs += item.bonusTimeExtendMs;
  }

  return {
    ...state,
    bonusTimeRemainingMs: state.bonusTimeRemainingMs + extendMs,
    bonusTimeMultiplier: Math.max(state.bonusTimeMultiplier, multiplier),
  };
}

export function tickBonusTime(state: GameState, deltaMs: number): GameState {
  if (state.bonusTimeRemainingMs <= 0) return state;
  const remaining = Math.max(0, state.bonusTimeRemainingMs - deltaMs);
  return {
    ...state,
    bonusTimeRemainingMs: remaining,
    bonusTimeMultiplier: remaining > 0 ? state.bonusTimeMultiplier : BONUS_TIME_DEFAULT_MULT,
  };
}

export function canEquipItem(state: GameState, itemId: string): boolean {
  return (
    state.equippedItemIds.length < MAX_EQUIPPED_ITEMS &&
    !state.equippedItemIds.includes(itemId)
  );
}

export function isCleared(state: GameState): boolean {
  return state.totalClicks >= GOAL_CLICKS || state.cleared;
}

export function isInputBlocked(state: GameState): boolean {
  return isCleared(state);
}

export function hasSpaceHoldItem(state: GameState): boolean {
  return hasSpaceHoldEquipped(state.equippedItemIds);
}

export function hasSpaceHoldEquipped(equippedItemIds: string[]): boolean {
  return equippedItemIds.some((id) => getItem(id)?.spaceHold === true);
}

export function getPassiveCps(state: GameState): number {
  let cps = 0;
  for (const id of state.equippedItemIds) {
    cps += getItem(id)?.passiveCps ?? 0;
  }
  if (cps <= 0) return 0;
  return Math.max(1, Math.floor(cps * getBonusMultiplier(state)));
}

export function needsGameLoop(state: GameState): boolean {
  return state.bonusTimeRemainingMs > 0 || getPassiveCps(state) > 0;
}

export function calcPassiveGain(
  state: GameState,
  accumulatorMs: number,
  deltaMs: number,
): { gain: number; nextAccumulatorMs: number } {
  const cps = getPassiveCps(state);
  if (cps <= 0 || isCleared(state)) {
    return { gain: 0, nextAccumulatorMs: 0 };
  }

  const total = accumulatorMs + deltaMs;
  const ticks = Math.floor(total / PASSIVE_TICK_MS);
  if (ticks <= 0) {
    return { gain: 0, nextAccumulatorMs: total };
  }

  return {
    gain: ticks * cps,
    nextAccumulatorMs: total % PASSIVE_TICK_MS,
  };
}
