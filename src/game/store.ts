import { create } from "zustand";
import {
  MAX_CLICKS_PER_FRAME,
  MAX_CLICKS_PER_SECOND,
  MAX_POPS,
  OFFLINE_PASSIVE_CAP_MS,
  PERSIST_DEBOUNCE_MS,
  POP_MIN_INTERVAL_MS,
  SAVE_KEY,
} from "./config";
import type { GameState, PopEvent, RewardChoice } from "./types";
import { updatePersonalBest, getPersonalBest } from "./engine/best";
import {
  calcPassiveGain,
  getPassiveCps,
  needsGameLoop,
  tickBonusTime,
} from "./engine/click";
import {
  loadSaveFromStorage,
  parseSave,
  readSaveTimestamp,
  serializeSave,
  writeSaveToStorage,
} from "./engine/save";
import {
  applyPassiveGain,
  applyReward,
  createInitialState,
  performClickBurst,
  resetGame,
} from "./engine/stage";
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

let burstCount = 0;
let burstX = 0;
let burstY = 0;
let burstRafId: number | null = null;

let clicksThisSecond = 0;
let secondWindowStart = Date.now();

let lastPopAt = 0;
let passiveAccumulatorMs = 0;

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

function applyOfflinePassive(state: GameState): { state: GameState; offlineGain: number } {
  const savedAt = readSaveTimestamp(SAVE_KEY);
  if (!savedAt) return { state, offlineGain: 0 };

  const elapsed = Math.min(Date.now() - savedAt, OFFLINE_PASSIVE_CAP_MS);
  const cps = getPassiveCps(state);
  if (cps <= 0 || elapsed < 1000) return { state, offlineGain: 0 };

  const seconds = Math.floor(elapsed / 1000);
  const offlineGain = seconds * cps;
  if (offlineGain <= 0) return { state, offlineGain: 0 };

  return {
    state: applyPassiveGain(state, offlineGain),
    offlineGain,
  };
}

function maybeShowPop(
  popCounter: number,
  pops: PopEvent[],
  x: number,
  y: number,
  gain: number,
  isLucky: boolean,
): { popCounter: number; pops: PopEvent[] } {
  const now = Date.now();
  if (gain <= 0) return { popCounter, pops };
  if (!isLucky && now - lastPopAt < POP_MIN_INTERVAL_MS) {
    return { popCounter, pops };
  }

  lastPopAt = now;
  const pop: PopEvent = {
    id: popCounter + 1,
    x,
    y,
    text: isLucky ? `LUCKY! +${gain}` : `+${gain}`,
    isLucky,
  };

  return {
    popCounter: popCounter + 1,
    pops: [...pops.slice(-(MAX_POPS - 1)), pop],
  };
}

export const useGameStore = create<GameStore>((set, get) => {
  const flushClickBurst = () => {
    burstRafId = null;
    const count = Math.min(burstCount, MAX_CLICKS_PER_FRAME);
    burstCount = 0;
    if (count <= 0) return;

    const { state, popCounter, pops } = get();
    const previousStage = state.stageIndex;
    const result = performClickBurst(state, count);
    if (result.gain <= 0) return;

    const newStage = getStageIndex(result.state.totalClicks);
    const stageUp = newStage > previousStage;
    const best = updatePersonalBest(result.state.totalClicks);

    if (result.isLucky) playLuckyChime();
    if (stageUp) playMilestoneChime();

    const popUpdate = maybeShowPop(
      popCounter,
      pops,
      burstX,
      burstY,
      result.gain,
      result.isLucky,
    );

    set({
      state: result.state,
      popCounter: popUpdate.popCounter,
      pops: popUpdate.pops,
      personalBest: best,
      stageFlash: stageUp ? newStage : null,
      lastActivityAt: Date.now(),
    });
    schedulePersist(result.state);
  };

  return {
    state: createInitialState(),
    toast: null,
    pops: [],
    popCounter: 0,
    personalBest: 0,
    stageFlash: null,
    lastActivityAt: Date.now(),

    hydrate: () => {
      const loaded = loadSaveFromStorage(SAVE_KEY);
      let state = loaded ?? createInitialState();
      passiveAccumulatorMs = state.passiveAccumulatorMs;
      const { state: withOffline, offlineGain } = applyOfflinePassive(state);
      state = withOffline;
      passiveAccumulatorMs = state.passiveAccumulatorMs;

      set({
        state,
        personalBest: getPersonalBest(),
        toast:
          offlineGain > 0
            ? `おかえりなさい！ 離席中 +${offlineGain.toLocaleString("ja-JP")} クリック`
            : null,
      });
    },

    touchActivity: () => set({ lastActivityAt: Date.now() }),

    click: (x, y) => {
      const now = Date.now();
      if (now - secondWindowStart >= 1000) {
        clicksThisSecond = 0;
        secondWindowStart = now;
      }
      if (clicksThisSecond >= MAX_CLICKS_PER_SECOND) return;
      clicksThisSecond += 1;

      burstCount = Math.min(burstCount + 1, MAX_CLICKS_PER_FRAME);
      burstX = x;
      burstY = y;

      if (burstRafId === null) {
        burstRafId = requestAnimationFrame(flushClickBurst);
      }
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
      if (!needsGameLoop(state)) return;

      const next = tickBonusTime(state, deltaMs);
      const passive = calcPassiveGain(next, passiveAccumulatorMs, deltaMs);
      passiveAccumulatorMs = passive.nextAccumulatorMs;

      const bonusChanged = next.bonusTimeRemainingMs !== state.bonusTimeRemainingMs;
      if (!bonusChanged && passive.gain <= 0) return;

      let merged = next;

      if (passive.gain > 0) {
        const previousStage = merged.stageIndex;
        merged = applyPassiveGain(merged, passive.gain);
        merged = { ...merged, passiveAccumulatorMs };
        const newStage = getStageIndex(merged.totalClicks);
        const stageUp = newStage > previousStage;
        const best = updatePersonalBest(merged.totalClicks);

        if (stageUp) playMilestoneChime();

        set({
          state: merged,
          personalBest: best,
          stageFlash: stageUp ? newStage : get().stageFlash,
          lastActivityAt: Date.now(),
        });
      } else {
        set({ state: merged });
      }

      schedulePersist(merged);
    },

    reset: () => {
      const next = resetGame();
      passiveAccumulatorMs = 0;
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
      passiveAccumulatorMs = parsed.passiveAccumulatorMs;
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
  };
});

export function getCurrentRewardStage(state: GameState): number | null {
  return state.pendingRewardQueue[0]?.stageIndex ?? null;
}

export function getRewardChoices(state: GameState): RewardChoice[] {
  const stage = getCurrentRewardStage(state);
  if (stage === null) return [];
  return state.pendingRewardQueue.filter((r) => r.stageIndex === stage);
}

/** ゲームループが必要か（ボーナスタイム or パッシブ収入） */
export function selectNeedsGameLoop(state: GameState): boolean {
  return needsGameLoop(state);
}
