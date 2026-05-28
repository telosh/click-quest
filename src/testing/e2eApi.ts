import { GOAL_CLICKS } from "../game/config";
import { getStageIndex } from "../game/data/stages";
import { createInitialState } from "../game/engine/click";
import { serializeSave } from "../game/engine/save";
import { applyPassiveGain, performClickBurst } from "../game/engine/stage";
import type { GameState } from "../game/types";
import { useGameStore } from "../game/store";

export interface ClickQuestE2eApi {
  readonly GOAL_CLICKS: number;
  getState: () => GameState;
  setState: (partial: Partial<GameState>) => void;
  setTotalClicks: (totalClicks: number) => void;
  burstClick: (count: number) => { gain: number; state: GameState };
  applyGain: (gain: number) => GameState;
  tick: (deltaMs: number) => void;
  loadSaveJson: (json: string) => boolean;
  exportSaveJson: () => string;
  simulateToGoal: (chunkGain?: number) => { iterations: number; state: GameState };
}

declare global {
  interface Window {
    __CLICK_QUEST__?: ClickQuestE2eApi;
  }
}

function mergeState(partial: Partial<GameState>): GameState {
  const current = useGameStore.getState().state;
  const totalClicks = Math.min(
    partial.totalClicks ?? current.totalClicks,
    GOAL_CLICKS,
  );
  const next: GameState = {
    ...current,
    ...partial,
    totalClicks,
    stageIndex: getStageIndex(totalClicks),
    cleared: partial.cleared ?? totalClicks >= GOAL_CLICKS,
  };
  useGameStore.setState({ state: next });
  return next;
}

export function installE2eApi(): void {
  const api: ClickQuestE2eApi = {
    GOAL_CLICKS,

    getState: () => useGameStore.getState().state,

    setState: (partial) => mergeState(partial),

    setTotalClicks: (totalClicks) => mergeState({ totalClicks }),

    burstClick: (count) => {
      const state = useGameStore.getState().state;
      const result = performClickBurst(state, count);
      useGameStore.setState({ state: result.state });
      return result;
    },

    applyGain: (gain) => {
      const state = useGameStore.getState().state;
      const next = applyPassiveGain(state, gain);
      useGameStore.setState({ state: next });
      return next;
    },

    tick: (deltaMs) => useGameStore.getState().tick(deltaMs),

    loadSaveJson: (json) => useGameStore.getState().importSave(json),

    exportSaveJson: () => serializeSave(useGameStore.getState().state),

    simulateToGoal: (chunkGain = 250_000) => {
      let state = useGameStore.getState().state;
      if (state.cleared) return { iterations: 0, state };

      let iterations = 0;
      while (!state.cleared && iterations < 10_000) {
        state = applyPassiveGain(state, chunkGain);
        iterations += 1;
      }
      useGameStore.setState({ state });
      return { iterations, state };
    },
  };

  window.__CLICK_QUEST__ = api;
}

export function createNearGoalSave(clicksFromGoal = 5): string {
  const totalClicks = GOAL_CLICKS - clicksFromGoal;
  return serializeSave({
    ...createInitialState(),
    totalClicks,
    stageIndex: getStageIndex(totalClicks),
    power: 50,
    cleared: false,
  });
}
