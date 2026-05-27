export const COMFORT_MESSAGES = [
  "いい調子です（担当者の感想）",
  "今日もクリック、尊い",
  "休憩してもいいですよ（多分）",
  "1000超えたあなたに、小さな拍手",
  "このゲーム、開発者が一番遊んでます",
  "指、まだ大丈夫そう？",
  "数字が増える音、聞こえませんが増えてます",
  "あなたのクリック、宇宙には届きませんがここには届いてます",
  "無駄押し、最高です",
  "公式応援団より：その調子（たぶん）",
  "進捗バーが、じわじわ育ってます",
  "ラッキーが来たら、私も喜びます",
  "Stage 報酬、ちゃんと選んで偉い",
  "長押しアイテム、見つけた人だけの小さな特権",
  "今のあなたにBGM、要ります？",
] as const;

export function pickComfortMessage(): string {
  return COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];
}

export function randomComfortInterval(minMs: number, maxMs: number): number {
  return minMs + Math.floor(Math.random() * (maxMs - minMs));
}
