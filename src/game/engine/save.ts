import { SAVE_VERSION } from "../config";
import type { GameState, RewardChoice } from "../types";
import { getStageIndex } from "../data/stages";
import { createInitialState } from "./click";

function isValidRewardChoice(value: unknown): value is RewardChoice {
  if (!value || typeof value !== "object") return false;
  const reward = value as Partial<RewardChoice>;
  return (
    typeof reward.id === "string" &&
    typeof reward.kind === "string" &&
    typeof reward.rank === "string" &&
    typeof reward.label === "string" &&
    typeof reward.variantLabel === "string" &&
    typeof reward.description === "string" &&
    typeof reward.iconKey === "string" &&
    typeof reward.stageIndex === "number"
  );
}

function sanitizeRewardQueue(queue: unknown): RewardChoice[] {
  if (!Array.isArray(queue)) return [];
  return queue.filter(isValidRewardChoice);
}

export function serializeSave(state: GameState): string {
  const payload = {
    saveVersion: SAVE_VERSION,
    totalClicks: state.totalClicks,
    stageIndex: state.stageIndex,
    power: state.power,
    luckyChance: state.luckyChance,
    equippedItemIds: state.equippedItemIds,
    bonusTimeRemainingMs: state.bonusTimeRemainingMs,
    bonusTimeMultiplier: state.bonusTimeMultiplier,
    cleared: state.cleared,
    lastClickAt: 0,
    comboStreak: 0,
    pendingRewardQueue: state.pendingRewardQueue,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseSave(raw: string): GameState | null {
  try {
    const data = JSON.parse(raw) as Partial<GameState>;
    if (typeof data.totalClicks !== "number") return null;

    const base = createInitialState();
    const totalClicks = data.totalClicks ?? 0;
    return {
      ...base,
      saveVersion: data.saveVersion ?? SAVE_VERSION,
      totalClicks,
      stageIndex: getStageIndex(totalClicks),
      power: data.power ?? base.power,
      luckyChance: data.luckyChance ?? base.luckyChance,
      equippedItemIds: Array.isArray(data.equippedItemIds) ? data.equippedItemIds : [],
      bonusTimeRemainingMs: data.bonusTimeRemainingMs ?? 0,
      bonusTimeMultiplier: data.bonusTimeMultiplier ?? base.bonusTimeMultiplier,
      cleared: Boolean(data.cleared),
      pendingRewardQueue: sanitizeRewardQueue(data.pendingRewardQueue),
      lastClickAt: 0,
      comboStreak: 0,
    };
  } catch {
    return null;
  }
}

export function loadSaveFromStorage(key: string): GameState | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return parseSave(raw);
}

export function writeSaveToStorage(key: string, state: GameState): void {
  localStorage.setItem(key, serializeSave(state));
}
