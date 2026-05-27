const BEST_KEY = "click-quest-best";

export function getPersonalBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function updatePersonalBest(totalClicks: number): number {
  const current = getPersonalBest();
  if (totalClicks <= current) return current;
  try {
    localStorage.setItem(BEST_KEY, String(Math.floor(totalClicks)));
  } catch {
    // ignore quota errors
  }
  return Math.floor(totalClicks);
}

export function resetPersonalBest(): void {
  try {
    localStorage.removeItem(BEST_KEY);
  } catch {
    // ignore
  }
}
