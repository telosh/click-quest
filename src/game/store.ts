import { create } from "zustand";
import { PERSIST_DEBOUNCE_MS, SAVE_KEY } from "./config";
import type { GameState, PopEvent, RewardChoice } from "./types";
import { updatePersonalBest, getPersonalBest } from "./engine/best";
import { tickBonusTime } from "./engine/click";
import { loadSaveFromStorage, parseSave, serializeSave, writeSaveToStorage } from "./engine/save";
import { applyReward, createInitialState, performClick, resetGame } from "./engine/stage";
import { playLuckyChime, playMilestoneChime } from "./engine/sound";
import { getStageIndex } from "./data/stages";

interface GameStore {
  state: GameState;
  toast: string | null;
  pops: PopEvent[];
  popCounter: number;
  personalBest: number;
  stageFlash: number | null;
  lastActivityAt: number;
  hydrate: () => void;
  click: (x: number, y: number) => void;
  selectReward: (rewardId: string) => void;
  tick: (deltaMs: number) => void;
  reset: () => void;
  exportSave: () => string;
  importSave: (raw: string) => boolean;
  clearToast: () => void;
  clearStageFlash: () => void;
  removePop: (id: number) => void;
  touchActivity: () => void;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(state: GameState) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    writeSaveToStorage(SAVE_KEY, state);
  }, PERSIST_DEBOUNCE_MS);
}

function persistNow(state: GameState) {
  if (persistTimer) clearTimeout(persistTimer);
  writeSaveToStorage(SAVE_KEY, state);
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  toast: null,
  pops: [],
  popCounter: 0,
  personalBest: 0,
  stageFlash: null,
  lastActivityAt: Date.now(),

  hydrate: () => {
    const loaded = loadSaveFromStorage(SAVE_KEY);
    set({
      state: loaded ?? createInitialState(),
      personalBest: getPersonalBest(),
    });
  },

  touchActivity: () => set({ lastActivityAt: Date.now() }),

  click: (x, y) => {
    const { state, popCounter } = get();
    const previousStage = state.stageIndex;
    const result = performClick(state);
    if (result.gain <= 0) return;

    const newStage = getStageIndex(result.state.totalClicks);
    const stageUp = newStage > previousStage;
    const best = updatePersonalBest(result.state.totalClicks);

    if (result.isLucky) playLuckyChime();
    if (stageUp) playMilestoneChime();

    const pop: PopEvent = {
      id: popCounter + 1,
      x,
      y,
      text: result.isLucky ? `LUCKY! +${result.gain}` : `+${result.gain}`,
      isLucky: result.isLucky,
    };

    set({
      state: result.state,
      popCounter: popCounter + 1,
      pops: [...get().pops.slice(-7), pop],
      personalBest: best,
      stageFlash: stageUp ? newStage : null,
      lastActivityAt: Date.now(),
    });
    schedulePersist(result.state);
  },

  selectReward: (rewardId) => {
    const { state } = get();
    const reward = state.pendingRewardQueue.find((r) => r.id === rewardId);
    if (!reward) return;

    const previousStage = state.stageIndex;
    const next = applyReward(state, reward);
    const newStage = getStageIndex(next.totalClicks);
    const stageUp = newStage > previousStage;
    const best = updatePersonalBest(next.totalClicks);

    if (stageUp) playMilestoneChime();

    set({
      state: next,
      lastActivityAt: Date.now(),
      personalBest: best,
      stageFlash: stageUp ? newStage : get().stageFlash,
    });
    persistNow(next);
  },

  tick: (deltaMs) => {
    const { state } = get();
    const next = tickBonusTime(state, deltaMs);
    if (next.bonusTimeRemainingMs === state.bonusTimeRemainingMs) return;
    set({ state: next });
    schedulePersist(next);
  },

  reset: () => {
    const next = resetGame();
    set({
      state: next,
      pops: [],
      toast: null,
      stageFlash: null,
      lastActivityAt: Date.now(),
    });
    persistNow(next);
  },

  exportSave: () => serializeSave(get().state),

  importSave: (raw) => {
    const parsed = parseSave(raw);
    if (!parsed) {
      set({
        toast: "セーブデータを読み込めません。JSON 形式を確認してください",
      });
      return false;
    }
    const best = updatePersonalBest(parsed.totalClicks);
    set({
      state: parsed,
      toast: "セーブデータを復元しました",
      personalBest: best,
    });
    persistNow(parsed);
    return true;
  },

  clearToast: () => set({ toast: null }),

  clearStageFlash: () => set({ stageFlash: null }),

  removePop: (id) => set({ pops: get().pops.filter((pop) => pop.id !== id) }),
}));

export function getCurrentRewardStage(state: GameState): number | null {
  return state.pendingRewardQueue[0]?.stageIndex ?? null;
}

export function getRewardChoices(state: GameState): RewardChoice[] {
  const stage = getCurrentRewardStage(state);
  if (stage === null) return [];
  return state.pendingRewardQueue.filter((r) => r.stageIndex === stage);
}
