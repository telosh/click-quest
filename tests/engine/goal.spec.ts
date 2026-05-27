import { describe, expect, it } from "vitest";
import { GOAL_CLICKS } from "../../src/game/config";
import { getPassiveCps, createInitialState } from "../../src/game/engine/click";
import { applyPassiveGain, performClick, performClickBurst } from "../../src/game/engine/stage";

describe("1億クリック到達シミュレーション", () => {
  it("ゴール手前のクリックで totalClicks が 1億で打ち止めになる", () => {
    const state = {
      ...createInitialState(),
      totalClicks: GOAL_CLICKS - 3,
      power: 10,
    };
    const result = performClick(state);
    expect(result.state.totalClicks).toBe(GOAL_CLICKS);
    expect(result.state.cleared).toBe(true);
    expect(result.gain).toBeGreaterThan(0);
  });

  it("バースト連打でも 1億を超えない", () => {
    const state = {
      ...createInitialState(),
      totalClicks: GOAL_CLICKS - 1,
      power: 100,
    };
    const result = performClickBurst(state, 50);
    expect(result.state.totalClicks).toBe(GOAL_CLICKS);
    expect(result.state.cleared).toBe(true);
  });

  it("大量加算（パッシブ相当）で 0 から 1億まで到達できる", () => {
    let state = createInitialState();
    let iterations = 0;

    while (!state.cleared && iterations < 500) {
      state = applyPassiveGain(state, 500_000);
      iterations += 1;
    }

    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(500);
    expect(state.totalClicks).toBe(GOAL_CLICKS);
    expect(state.cleared).toBe(true);
  });

  it("クリア後はクリックしても増えない", () => {
    const cleared = {
      ...createInitialState(),
      totalClicks: GOAL_CLICKS,
      cleared: true,
    };
    const result = performClick(cleared);
    expect(result.gain).toBe(0);
    expect(result.state.totalClicks).toBe(GOAL_CLICKS);
  });
});

describe("新アイテム効果", () => {
  it("古地図でステージに応じたパッシブが増える", () => {
    const state = {
      ...createInitialState(),
      stageIndex: 10,
      equippedItemIds: ["ancientMap"],
    };
    expect(getPassiveCps(state)).toBeGreaterThanOrEqual(10);
  });

  it("コンベアで Power に連動したパッシブが付く", () => {
    const state = {
      ...createInitialState(),
      power: 100,
      equippedItemIds: ["conveyor"],
    };
    expect(getPassiveCps(state)).toBeGreaterThanOrEqual(1);
  });
});
