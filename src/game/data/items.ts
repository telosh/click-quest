import type { ItemDef } from "../types";

export const ITEMS: ItemDef[] = [
  {
    id: "ring",
    name: "指輪",
    description: "Power +10%",
    minStage: 2,
    powerMult: 0.1,
  },
  {
    id: "clover",
    name: "四つ葉",
    description: "Lucky Chance +3%",
    minStage: 3,
    luckyBonus: 0.03,
  },
  {
    id: "gloves",
    name: "連打グローブ",
    description: "連続クリックで最大 +20% Power",
    minStage: 6,
    comboBonus: 0.2,
  },
  {
    id: "hourglass",
    name: "砂時計",
    description: "ボーナスタイム +10秒",
    minStage: 8,
    bonusTimeExtendMs: 10_000,
  },
  {
    id: "rainbow",
    name: "虹の石",
    description: "ラッキー倍率 ×1.5",
    minStage: 12,
    luckyMultBonus: 0.5,
  },
  {
    id: "crown",
    name: "王冠",
    description: "Power +25%",
    minStage: 10,
    powerMult: 0.25,
  },
  {
    id: "star",
    name: "星の欠片",
    description: "Lucky Chance +5%",
    minStage: 14,
    luckyBonus: 0.05,
  },
];

export const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef | undefined {
  return ITEM_MAP.get(id);
}

export function getItemsForStage(stageIndex: number): ItemDef[] {
  return ITEMS.filter((item) => item.minStage <= stageIndex);
}
