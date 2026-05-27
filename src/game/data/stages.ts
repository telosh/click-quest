import type { StageGrowth } from "../types";

export const STAGE_THRESHOLDS = [
  0,
  100,
  1_000,
  2_500,
  5_000,
  10_000,
  25_000,
  50_000,
  100_000,
  250_000,
  500_000,
  1_000_000,
  2_500_000,
  5_000_000,
  10_000_000,
  25_000_000,
  50_000_000,
  100_000_000,
] as const;

export const STAGE_GROWTH: StageGrowth[] = [
  { power: 1, lucky: 0.03 },
  { power: 1, lucky: 0.005 },
  { power: 1, lucky: 0.005 },
  { power: 2, lucky: 0.01 },
  { power: 2, lucky: 0.01 },
  { power: 3, lucky: 0.01 },
  { power: 3, lucky: 0.015 },
  { power: 4, lucky: 0.015 },
  { power: 5, lucky: 0.02 },
  { power: 6, lucky: 0.02 },
  { power: 8, lucky: 0.02 },
  { power: 10, lucky: 0.025 },
  { power: 12, lucky: 0.025 },
  { power: 15, lucky: 0.03 },
  { power: 20, lucky: 0.03 },
  { power: 25, lucky: 0.035 },
  { power: 30, lucky: 0.035 },
  { power: 0, lucky: 0 },
];

export function getStageIndex(totalClicks: number): number {
  let index = 0;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (totalClicks >= STAGE_THRESHOLDS[i]) {
      index = i;
      break;
    }
  }
  return index;
}

export function getNextThreshold(stageIndex: number): number | null {
  const next = stageIndex + 1;
  if (next >= STAGE_THRESHOLDS.length) return null;
  return STAGE_THRESHOLDS[next];
}

export function getStageGrowth(stageIndex: number): StageGrowth {
  return STAGE_GROWTH[stageIndex] ?? { power: 0, lucky: 0 };
}

export function getNewStageIndices(
  previousStageIndex: number,
  totalClicks: number,
): number[] {
  const newStage = getStageIndex(totalClicks);
  if (newStage <= previousStageIndex) return [];

  const indices: number[] = [];
  for (let i = previousStageIndex + 1; i <= newStage; i += 1) {
    if (i > 0) indices.push(i);
  }
  return indices;
}
