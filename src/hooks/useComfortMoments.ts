import { useEffect, useRef, useState } from "react";
import {
  COMFORT_MESSAGE_MAX_MS,
  COMFORT_MESSAGE_MIN_MS,
  COMFORT_UNLOCK_CLICKS,
} from "../game/config";
import { pickComfortMessage, randomComfortInterval } from "../game/data/comfortMessages";

interface UseComfortMomentsOptions {
  totalClicks: number;
  active: boolean;
}

export function useComfortMoments({ totalClicks, active }: UseComfortMomentsOptions) {
  const [message, setMessage] = useState<string | null>(null);
  const unlockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlocked = totalClicks >= COMFORT_UNLOCK_CLICKS;

  useEffect(() => {
    if (!active || !unlocked) return;

    if (!unlockedRef.current) {
      unlockedRef.current = true;
      setMessage("1000クリック突破！ 公式応援団がやってきました");
    }
  }, [active, unlocked]);

  useEffect(() => {
    if (!active || !unlocked) return;

    const scheduleNext = () => {
      const delay = randomComfortInterval(COMFORT_MESSAGE_MIN_MS, COMFORT_MESSAGE_MAX_MS);
      timerRef.current = setTimeout(() => {
        setMessage(pickComfortMessage());
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, unlocked]);

  const dismissMessage = () => setMessage(null);

  return { unlocked, message, dismissMessage };
}
