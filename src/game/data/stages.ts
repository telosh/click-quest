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

/** ステージ到達では成長しない（アイテム・報酬のみ） */
export const STAGE_GROWTH: StageGrowth[] = STAGE_THRESHOLDS.map(() => ({
  power: 0,
  lucky: 0,
}));

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
