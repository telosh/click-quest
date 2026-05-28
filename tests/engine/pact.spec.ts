import { describe, expect, it } from "vitest";
import {
  createInitialState,
  getBasePower,
  getEffectivePower,
  getEffectiveLuckyChance,
  getEffectivePowerCap,
} from "../../src/game/engine/click";
import { applyReward } from "../../src/game/engine/stage";
import type { RewardChoice } from "../../src/game/types";

describe("ステージ成長", () => {
  it("ステージ到達では Power が増えない", async () => {
    const { applyStageGrowth } = await import("../../src/game/engine/stage");
    const { getStageGrowth } = await import("../../src/game/data/stages");

    const state = createInitialState();
    const growth = getStageGrowth(10);
    expect(growth.power).toBe(0);
    expect(growth.lucky).toBe(0);

    const next = applyStageGrowth(state, 10);
    expect(next.power).toBe(state.power);
    expect(next.luckyChance).toBe(state.luckyChance);
  });
});

describe("契約・トレードオフ", () => {
  it("ガラスの仮面でベース Power が 1 に固定され Lucky が上がる", () => {
    const state = {
      ...createInitialState(),
      power: 50,
      equippedItemIds: ["glassMask"],
    };
    expect(getBasePower(state)).toBe(1);
    expect(getEffectiveLuckyChance(state)).toBeGreaterThanOrEqual(0.5);
  });

  it("契約報酬で Power 上限と Lucky を付与できる", () => {
    const reward: RewardChoice = {
      id: "test-pact",
      kind: "pact",
      rank: "S",
      label: "契約",
      variantLabel: "豪運の代償",
      description: "test",
      iconKey: "pact",
      luckyGain: 0.5,
      powerCap: 1,
      stageIndex: 1,
    };

    const next = applyReward(
      { ...createInitialState(), power: 20 },
      reward,
    );
    expect(next.permanentPact?.powerCap).toBe(1);
    expect(next.permanentPact?.luckyBonus).toBe(0.5);
    expect(next.luckyChance).toBe(0.03);
    expect(getEffectiveLuckyChance(next)).toBe(0.5);
    expect(getBasePower(next)).toBe(1);
  });

  it("永続契約を破棄できる", async () => {
    const { discardPermanentPact } = await import("../../src/game/engine/pact");
    const withPact = applyReward(createInitialState(), {
      id: "p",
      kind: "pact",
      rank: "S",
      label: "契約",
      variantLabel: "豪運",
      description: "",
      iconKey: "pact",
      luckyGain: 0.5,
      powerCap: 1,
      stageIndex: 1,
    });
    const cleared = discardPermanentPact(withPact);
    expect(cleared.permanentPact).toBeNull();
    expect(getEffectivePowerCap(cleared)).toBeNull();
  });

  it("いばらの契約で Power 倍率が下がる", () => {
    const state = {
      ...createInitialState(),
      power: 10,
      equippedItemIds: ["ring", "thornPact"],
    };
    const without = getEffectivePower({
      ...state,
      equippedItemIds: ["ring"],
    });
    const withPact = getEffectivePower(state);
    expect(withPact).toBeLessThan(without);
  });
});
