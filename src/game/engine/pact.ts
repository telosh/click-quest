import { BASE_LUCKY_CHANCE, MAX_LUCKY_CHANCE } from "../config";
import type { GameState, PermanentPact, RewardChoice } from "../types";

export function createEmptyPermanentPact(label = ""): PermanentPact {
  return {
    label,
    powerCap: null,
    luckyBonus: 0,
    powerDelta: 0,
  };
}

export function pactFromReward(reward: RewardChoice): PermanentPact {
  return {
    label: reward.variantLabel,
    powerCap: reward.powerCap ?? null,
    luckyBonus: reward.luckyGain ?? 0,
    powerDelta: reward.powerGain ?? 0,
  };
}

/** 永続契約を上書き（既存契約の Power 補正は差し替え） */
export function applyPermanentPact(
  state: GameState,
  pact: PermanentPact | null,
): GameState {
  const prev = state.permanentPact;
  let power = state.power;
  if (prev) {
    power = Math.max(1, power - prev.powerDelta);
  }
  if (pact) {
    power = Math.max(1, power + pact.powerDelta);
  }

  return {
    ...state,
    permanentPact: pact,
    power,
  };
}

export function discardPermanentPact(state: GameState): GameState {
  return applyPermanentPact(state, null);
}

export function getPermanentLuckyBonus(state: GameState): number {
  return state.permanentPact?.luckyBonus ?? 0;
}

export function getPermanentPowerCap(state: GameState): number | null {
  return state.permanentPact?.powerCap ?? null;
}

export function migrateLegacyPowerCap(
  powerCap: number | null | undefined,
  luckyChance: number,
): { permanentPact: PermanentPact | null; luckyChance: number } {
  if (powerCap === undefined || powerCap === null) {
    return { permanentPact: null, luckyChance };
  }
  const bonus = Math.max(0, luckyChance - BASE_LUCKY_CHANCE);
  return {
    permanentPact: {
      label: "移行された契約",
      powerCap,
      luckyBonus: Math.min(bonus, MAX_LUCKY_CHANCE),
      powerDelta: 0,
    },
    luckyChance: Math.max(BASE_LUCKY_CHANCE, luckyChance - Math.min(bonus, MAX_LUCKY_CHANCE)),
  };
}
