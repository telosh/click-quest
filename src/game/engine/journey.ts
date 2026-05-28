import {
  JOURNEY_KEY,
  JOURNEY_MAX_CLICKS,
  JOURNEY_MAX_EVENTS,
  JOURNEY_PERSIST_DEBOUNCE_MS,
} from "../config";
import { getNewStageIndices, STAGE_THRESHOLDS } from "../data/stages";
import type { GameState, RewardChoice, RewardRank } from "../types";

export const JOURNEY_VERSION = 2;

/** バースト1回: [前回からのms, 増分, 入力回数?, ラッキー=1?] */
export type ClickTick = [number, number] | [number, number, number] | [number, number, number, number];

export type JourneyEventKind = "session" | "stage" | "reward";

export interface JourneyEvent {
  t: number;
  kind: JourneyEventKind;
  totalClicks: number;
  stageIndex: number;
  rewardLabel?: string;
  rewardRank?: RewardRank;
  itemId?: string;
}

export interface JourneyLog {
  version: number;
  anchorT: number;
  anchorClicks: number;
  clicks: ClickTick[];
  events: JourneyEvent[];
}

let lastTickAt = 0;
let pendingLog: JourneyLog | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function emptyLog(): JourneyLog {
  const now = Date.now();
  return {
    version: JOURNEY_VERSION,
    anchorT: now,
    anchorClicks: 0,
    clicks: [],
    events: [],
  };
}

function pruneClicks(clicks: ClickTick[]): ClickTick[] {
  if (clicks.length <= JOURNEY_MAX_CLICKS) return clicks;

  const keepRecent = Math.floor(JOURNEY_MAX_CLICKS * 0.65);
  const old = clicks.slice(0, clicks.length - keepRecent);
  const recent = clicks.slice(-keepRecent);

  const targetOld = JOURNEY_MAX_CLICKS - keepRecent;
  const step = Math.max(1, Math.ceil(old.length / targetOld));
  const compressed: ClickTick[] = [];
  for (let i = 0; i < old.length; i += step) {
    compressed.push(old[i]);
  }

  return [...compressed, ...recent].slice(-JOURNEY_MAX_CLICKS);
}

function pruneEvents(events: JourneyEvent[]): JourneyEvent[] {
  if (events.length <= JOURNEY_MAX_EVENTS) return events;
  return events.slice(-JOURNEY_MAX_EVENTS);
}

function normalizeLog(data: Partial<JourneyLog> & { events?: unknown[] }): JourneyLog {
  const base = emptyLog();
  const events = Array.isArray(data.events)
    ? data.events.filter(isValidEvent)
    : [];

  const clicks = Array.isArray(data.clicks)
    ? data.clicks.filter(isValidTick)
    : [];

  return {
    version: JOURNEY_VERSION,
    anchorT: typeof data.anchorT === "number" ? data.anchorT : base.anchorT,
    anchorClicks: typeof data.anchorClicks === "number" ? data.anchorClicks : 0,
    clicks: pruneClicks(clicks),
    events: pruneEvents(events),
  };
}

function migrateV1(raw: { events?: unknown[] }): JourneyLog {
  const log = emptyLog();
  if (!Array.isArray(raw.events)) return log;

  for (const value of raw.events) {
    if (!value || typeof value !== "object") continue;
    const kind = (value as { kind?: string }).kind;
    if (kind === "sample") continue;
    if (!isValidEvent(value)) continue;
    log.events.push(value);
  }
  return log;
}

export function parseJourney(raw: string | null): JourneyLog {
  if (!raw) return emptyLog();
  try {
    const data = JSON.parse(raw) as Partial<JourneyLog> & { events?: unknown[] };
    if (data.version === 2 || Array.isArray(data.clicks)) {
      return normalizeLog(data);
    }
    return migrateV1(data);
  } catch {
    return emptyLog();
  }
}

function isValidEvent(value: unknown): value is JourneyEvent {
  if (!value || typeof value !== "object") return false;
  const ev = value as Partial<JourneyEvent>;
  return (
    typeof ev.t === "number" &&
    (ev.kind === "session" || ev.kind === "stage" || ev.kind === "reward") &&
    typeof ev.totalClicks === "number" &&
    typeof ev.stageIndex === "number"
  );
}

function isValidTick(value: unknown): value is ClickTick {
  if (!Array.isArray(value) || value.length < 2) return false;
  return (
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    value[0] >= 0 &&
    value[1] >= 0
  );
}

export function loadJourney(): JourneyLog {
  if (typeof localStorage === "undefined") return emptyLog();
  return parseJourney(localStorage.getItem(JOURNEY_KEY));
}

function getWritableLog(): JourneyLog {
  if (!pendingLog) {
    pendingLog = loadJourney();
    const last = pendingLog.clicks[pendingLog.clicks.length - 1];
    if (last) {
      let t = pendingLog.anchorT;
      for (const tick of pendingLog.clicks) t += tick[0];
      lastTickAt = t;
    } else {
      lastTickAt = pendingLog.anchorT;
    }
  }
  return pendingLog;
}

function writePendingLog(): void {
  if (!pendingLog || typeof localStorage === "undefined") return;
  const next = {
    ...pendingLog,
    clicks: pruneClicks(pendingLog.clicks),
    events: pruneEvents(pendingLog.events),
  };
  localStorage.setItem(JOURNEY_KEY, JSON.stringify(next));
  pendingLog = next;
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    writePendingLog();
  }, JOURNEY_PERSIST_DEBOUNCE_MS);
}

/** テスト・ページ離脱前用: 保留中の遍歴を即座に書き込む */
export function flushJourneyPersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  writePendingLog();
}

function appendEvent(log: JourneyLog, event: JourneyEvent): void {
  const last = log.events[log.events.length - 1];
  if (
    last &&
    last.kind === event.kind &&
    last.stageIndex === event.stageIndex &&
    last.totalClicks === event.totalClicks &&
    last.rewardLabel === event.rewardLabel &&
    event.t - last.t < 500
  ) {
    return;
  }
  log.events.push(event);
}

export function clearJourney(): void {
  lastTickAt = 0;
  pendingLog = null;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(JOURNEY_KEY);
}

export function syncJourneyBaselineFromLog(): void {
  const log = loadJourney();
  let t = log.anchorT;
  for (const tick of log.clicks) t += tick[0];
  lastTickAt = log.clicks.length > 0 ? t : log.anchorT;
}

/** クリックバースト（手動・パッシブ共通）を1ティックとして記録 */
export function recordClickBurst(params: {
  gain: number;
  inputCount?: number;
  isLucky?: boolean;
  totalClicks: number;
  stageIndex: number;
}): void {
  if (params.gain <= 0) return;

  const log = getWritableLog();
  const now = Date.now();
  const dt = Math.min(lastTickAt > 0 ? now - lastTickAt : 0, 60_000);
  lastTickAt = now;

  const tick: ClickTick =
    params.inputCount != null && params.inputCount > 0
      ? params.isLucky
        ? [dt, params.gain, params.inputCount, 1]
        : [dt, params.gain, params.inputCount]
      : params.isLucky
        ? [dt, params.gain, 1]
        : [dt, params.gain];

  log.clicks.push(tick);
  if (log.clicks.length === 1 && log.anchorClicks === 0) {
    log.anchorClicks = Math.max(0, params.totalClicks - params.gain);
    log.anchorT = now - dt;
  }

  schedulePersist();
}

export function recordSessionStart(state: GameState): void {
  const log = getWritableLog();
  const last = log.events[log.events.length - 1];
  if (last?.kind === "session" && Date.now() - last.t < 60_000) return;

  appendEvent(log, {
    t: Date.now(),
    kind: "session",
    totalClicks: state.totalClicks,
    stageIndex: state.stageIndex,
  });
  schedulePersist();
}

export function recordStageTransitions(
  previousStageIndex: number,
  state: GameState,
): void {
  const indices = getNewStageIndices(previousStageIndex, state.totalClicks);
  if (indices.length === 0) return;

  const log = getWritableLog();
  const now = Date.now();
  for (const stageIndex of indices) {
    appendEvent(log, {
      t: now,
      kind: "stage",
      totalClicks: state.totalClicks,
      stageIndex,
    });
  }
  schedulePersist();
}

export function recordRewardChoice(state: GameState, reward: RewardChoice): void {
  const log = getWritableLog();
  appendEvent(log, {
    t: Date.now(),
    kind: "reward",
    totalClicks: state.totalClicks,
    stageIndex: state.stageIndex,
    rewardLabel: reward.label,
    rewardRank: reward.rank,
    itemId: reward.itemId,
  });
  schedulePersist();
}

export function getInputClickCount(log: JourneyLog): number {
  let n = 0;
  for (const tick of log.clicks) {
    if (tick.length >= 3 && typeof tick[2] === "number" && tick[2] > 0) {
      n += tick[2];
    } else {
      n += 1;
    }
  }
  return n;
}

export function formatStageLabel(stageIndex: number): string {
  const threshold = STAGE_THRESHOLDS[stageIndex];
  if (threshold === undefined) return `S${stageIndex}`;
  if (threshold >= 1_000_000) {
    return `${(threshold / 1_000_000).toFixed(threshold % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (threshold >= 1_000) {
    return `${(threshold / 1_000).toFixed(threshold % 1_000 === 0 ? 0 : 1)}K`;
  }
  return String(threshold);
}

export function getJourneyStages(events: JourneyEvent[]): JourneyEvent[] {
  const seen = new Set<number>();
  const stages: JourneyEvent[] = [];
  for (const ev of events) {
    if (ev.kind !== "stage") continue;
    if (seen.has(ev.stageIndex)) continue;
    seen.add(ev.stageIndex);
    stages.push(ev);
  }
  return stages.sort((a, b) => a.stageIndex - b.stageIndex);
}

export function getJourneyRewards(events: JourneyEvent[]): JourneyEvent[] {
  return events.filter((e) => e.kind === "reward").slice(-8).reverse();
}

const CHART_POINT_LIMIT = 420;

function downsamplePoints(
  points: { t: number; clicks: number }[],
  max: number,
): { t: number; clicks: number }[] {
  if (points.length <= max) return points;
  const out: { t: number; clicks: number }[] = [];
  const step = points.length / max;
  for (let i = 0; i < max; i += 1) {
    out.push(points[Math.floor(i * step)]);
  }
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1]);
  }
  return out;
}

/** 折れ線グラフ用: クリックティックとマイルストーンから時系列を復元 */
export function buildProgressPoints(log: JourneyLog): { t: number; clicks: number }[] {
  const points: { t: number; clicks: number }[] = [
    { t: log.anchorT, clicks: log.anchorClicks },
  ];

  let t = log.anchorT;
  let clicks = log.anchorClicks;
  for (const tick of log.clicks) {
    t += tick[0];
    clicks += tick[1];
    points.push({ t, clicks });
  }

  for (const ev of log.events) {
    if (ev.kind === "session" || ev.kind === "stage") {
      points.push({ t: ev.t, clicks: ev.totalClicks });
    }
  }

  points.sort((a, b) => a.t - b.t);
  return downsamplePoints(points, CHART_POINT_LIMIT);
}

export function estimateJourneyBytes(log: JourneyLog): number {
  return JSON.stringify(log).length;
}
