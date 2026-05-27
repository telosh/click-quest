import type { ItemCategory, ItemDef } from "../types";

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  power: "火力",
  lucky: "幸運",
  passive: "自動",
  combo: "連打",
  bonus: "ブースト",
  input: "操作",
  hybrid: "複合",
};

export const ITEMS: ItemDef[] = [
  {
    id: "ring",
    name: "指輪",
    description: "Power +10%",
    minStage: 2,
    category: "power",
    powerMult: 0.1,
  },
  {
    id: "clover",
    name: "四つ葉",
    description: "Lucky Chance +3%",
    minStage: 3,
    category: "lucky",
    luckyBonus: 0.03,
  },
  {
    id: "pocketWatch",
    name: "懐中時計",
    description: "毎秒 +1 クリック（自動）",
    minStage: 3,
    category: "passive",
    passiveCps: 1,
  },
  {
    id: "tapStone",
    name: "タップの石",
    description: "長押しで自動タップ（スマホ向け）",
    minStage: 4,
    category: "input",
    touchHold: true,
  },
  {
    id: "metronome",
    name: "メトロノーム",
    description: "コンボが切れにくくなる（+250ms）",
    minStage: 4,
    category: "combo",
    comboWindowExtendMs: 250,
  },
  {
    id: "helper",
    name: "見習いクリッカー",
    description: "毎秒 +3 クリック（自動）",
    minStage: 5,
    category: "passive",
    passiveCps: 3,
  },
  {
    id: "dice",
    name: "幸運のサイコロ",
    description: "Lucky +2% / ラッキー倍率 +15%",
    minStage: 5,
    category: "lucky",
    luckyBonus: 0.02,
    luckyMultBonus: 0.15,
  },
  {
    id: "spaceKey",
    name: "スペースキー固定器",
    description: "Space 長押しで自動クリック（短押しは1回）",
    minStage: 2,
    category: "input",
    spaceHold: true,
  },
  {
    id: "ancientMap",
    name: "古地図",
    description: "ステージが上がるほど自動 +1/秒（累積）",
    minStage: 6,
    category: "passive",
    passiveStageBonus: 1,
  },
  {
    id: "gloves",
    name: "連打グローブ",
    description: "連続クリックで最大 +20% Power",
    minStage: 6,
    category: "combo",
    comboBonus: 0.2,
  },
  {
    id: "conveyor",
    name: "コンベア",
    description: "Power の 1.5% を毎秒自動加算",
    minStage: 7,
    category: "passive",
    passivePowerScale: 0.015,
  },
  {
    id: "hourglass",
    name: "砂時計",
    description: "ボーナスタイム +10秒",
    minStage: 8,
    category: "bonus",
    bonusTimeExtendMs: 10_000,
  },
  {
    id: "farm",
    name: "クリック農場",
    description: "毎秒 +8 クリック（自動）",
    minStage: 9,
    category: "passive",
    passiveCps: 8,
  },
  {
    id: "megaphone",
    name: "メガホン",
    description: "ボーナスタイム中の倍率 +0.35",
    minStage: 11,
    category: "bonus",
    bonusTimeMultBonus: 0.35,
  },
  {
    id: "rainbow",
    name: "虹の石",
    description: "ラッキー倍率 ×1.5",
    minStage: 12,
    category: "lucky",
    luckyMultBonus: 0.5,
  },
  {
    id: "amplifier",
    name: "増幅器",
    description: "Power +8% / 毎秒 +2 自動",
    minStage: 13,
    category: "hybrid",
    powerMult: 0.08,
    passiveCps: 2,
  },
  {
    id: "crown",
    name: "王冠",
    description: "Power +25%",
    minStage: 10,
    category: "power",
    powerMult: 0.25,
  },
  {
    id: "star",
    name: "星の欠片",
    description: "Lucky Chance +5%",
    minStage: 14,
    category: "lucky",
    luckyBonus: 0.05,
  },
  {
    id: "factory",
    name: "自動工場",
    description: "毎秒 +20 クリック（自動）",
    minStage: 15,
    category: "passive",
    passiveCps: 20,
  },
];

export const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef | undefined {
  return ITEM_MAP.get(id);
}

export function getItemsForStage(stageIndex: number): ItemDef[] {
  return ITEMS.filter((item) => item.minStage <= stageIndex);
}
