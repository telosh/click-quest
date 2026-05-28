import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JOURNEY_KEY } from "../../src/game/config";
import { createInitialState } from "../../src/game/engine/click";
import {
  buildProgressPoints,
  clearJourney,
  formatStageLabel,
  getInputClickCount,
  getJourneyStages,
  loadJourney,
  parseJourney,
  flushJourneyPersist,
  recordClickBurst,
  recordRewardChoice,
  recordStageTransitions,
} from "../../src/game/engine/journey";
import type { RewardChoice } from "../../src/game/types";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  });
  clearJourney();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("クリック遍歴", () => {
  it("クリックバーストをティックとして記録する", () => {
    recordClickBurst({
      gain: 3,
      inputCount: 2,
      totalClicks: 3,
      stageIndex: 0,
    });
    recordClickBurst({
      gain: 5,
      inputCount: 1,
      isLucky: true,
      totalClicks: 8,
      stageIndex: 0,
    });

    flushJourneyPersist();
    const log = loadJourney();
    expect(log.clicks).toHaveLength(2);
    expect(getInputClickCount(log)).toBe(3);
  });

  it("ステージ到達を記録する", () => {
    const state = { ...createInitialState(), totalClicks: 150, stageIndex: 1 };
    recordStageTransitions(0, state);
    flushJourneyPersist();

    const log = loadJourney();
    expect(log.events.some((e) => e.kind === "stage" && e.stageIndex === 1)).toBe(true);
  });

  it("報酬選択を記録する", () => {
    const reward: RewardChoice = {
      id: "r1",
      kind: "item",
      rank: "B",
      label: "テスト剣",
      variantLabel: "B",
      description: "test",
      iconKey: "sword",
      itemId: "starterSword",
      stageIndex: 2,
    };
    const state = { ...createInitialState(), totalClicks: 1200, stageIndex: 2 };
    recordRewardChoice(state, reward);
    flushJourneyPersist();

    const events = loadJourney().events;
    expect(events.find((e) => e.kind === "reward")?.rewardLabel).toBe("テスト剣");
  });

  it("リセットで遍歴を消す", () => {
    recordClickBurst({ gain: 1, inputCount: 1, totalClicks: 1, stageIndex: 0 });
    clearJourney();
    expect(loadJourney().clicks).toHaveLength(0);
    expect(storage.has(JOURNEY_KEY)).toBe(false);
  });

  it("v1セーブからマイルストーンだけ移行する", () => {
    const raw = JSON.stringify({
      version: 1,
      events: [
        { t: 1, kind: "sample", totalClicks: 50, stageIndex: 0 },
        { t: 2, kind: "stage", totalClicks: 150, stageIndex: 1 },
      ],
    });
    const log = parseJourney(raw);
    expect(log.clicks).toHaveLength(0);
    expect(getJourneyStages(log.events)).toHaveLength(1);
  });

  it("進行グラフ用ポイントを組み立てる", () => {
    const log = parseJourney(
      JSON.stringify({
        version: 2,
        anchorT: 1000,
        anchorClicks: 0,
        clicks: [
          [0, 10],
          [100, 20],
        ],
        events: [{ t: 1100, kind: "stage", totalClicks: 30, stageIndex: 1 }],
      }),
    );
    const points = buildProgressPoints(log);
    expect(points.length).toBeGreaterThanOrEqual(3);
  });

  it("ステージラベルを短く表示する", () => {
    expect(formatStageLabel(10)).toMatch(/K|M|\d/);
  });
});
