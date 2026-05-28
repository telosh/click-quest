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
import { getPermanentLuckyBonus, getPermanentPowerCap } from "./pact";

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    totalClicks: 0,
    stageIndex: 0,
    power: 1,
    permanentPact: null,
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
    if (item?.powerMultPenalty) mult -= item.powerMultPenalty;
  }
  return Math.max(0.05, mult);
}

export function getEffectivePowerCap(state: GameState): number | null {
  let cap = getPermanentPowerCap(state);
  for (const id of state.equippedItemIds) {
    const itemCap = getItem(id)?.powerCap;
    if (itemCap !== undefined) {
      cap = cap === null ? itemCap : Math.min(cap, itemCap);
    }
  }
  return cap;
}

export function getBasePower(state: GameState): number {
  const cap = getEffectivePowerCap(state);
  const power = cap === null ? state.power : Math.min(state.power, cap);
  return Math.max(1, power);
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
    state.luckyChance +
      getPermanentLuckyBonus(state) +
      getItemLuckyBonus(state.equippedItemIds),
  );
}

export function getEffectivePower(state: GameState): number {
  const combo = getComboBonus(state);
  return (
    getBasePower(state) * getItemPowerMultiplier(state.equippedItemIds) * (1 + combo)
  );
}

export function getLuckyMultiplier(state: GameState): number {
  return LUCKY_MULTIPLIER * (1 + getItemLuckyMultBonus(state.equippedItemIds));
}

export function isBonusActive(state: GameState): boolean {
  return state.bonusTimeRemainingMs > 0;
}

export function getComboWindowMs(equippedItemIds: string[]): number {
  let extend = 0;
  for (const id of equippedItemIds) {
    extend += getItem(id)?.comboWindowExtendMs ?? 0;
  }
  return COMBO_WINDOW_MS + extend;
}

export function getBonusTimeMultBonus(equippedItemIds: string[]): number {
  let bonus = 0;
  for (const id of equippedItemIds) {
    bonus += getItem(id)?.bonusTimeMultBonus ?? 0;
  }
  return bonus;
}

export function getBonusMultiplier(state: GameState): number {
  if (!isBonusActive(state)) return 1;
  return state.bonusTimeMultiplier + getBonusTimeMultBonus(state.equippedItemIds);
}

export function updateCombo(state: GameState, now: number): GameState {
  const windowMs = getComboWindowMs(state.equippedItemIds);
  if (state.lastClickAt > 0 && now - state.lastClickAt <= windowMs) {
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

export function hasTouchHoldEquipped(equippedItemIds: string[]): boolean {
  return equippedItemIds.some((id) => getItem(id)?.touchHold === true);
}

export function getPassiveCps(state: GameState): number {
  let base = 0;
  let powerScale = 0;
  let stageBonus = 0;

  for (const id of state.equippedItemIds) {
    const item = getItem(id);
    base += item?.passiveCps ?? 0;
    powerScale += item?.passivePowerScale ?? 0;
    stageBonus += item?.passiveStageBonus ?? 0;
  }

  const scaledPower = powerScale > 0 ? Math.floor(getEffectivePower(state) * powerScale) : 0;
  const scaledStage = stageBonus > 0 ? Math.floor(state.stageIndex * stageBonus) : 0;
  const total = base + scaledPower + scaledStage;

  if (total <= 0) return 0;
  return Math.max(1, Math.floor(total * getBonusMultiplier(state)));
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
