export function formatNumber(value: number): string {
  return Math.floor(value).toLocaleString("ja-JP");
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMultiplier(value: number): string {
  return `×${value.toFixed(1)}`;
}

export function formatSeconds(ms: number): string {
  return `${Math.ceil(ms / 1000)}秒`;
}
