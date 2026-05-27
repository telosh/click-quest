import { useEffect, useRef } from "react";
import { useGameStore } from "../game/store";

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const lastRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) lastRef.current = performance.now();
    };

    document.addEventListener("visibilitychange", onVisibility);
    pausedRef.current = document.hidden;
    lastRef.current = performance.now();

    let frame = 0;
    const loop = (now: number) => {
      if (lastRef.current !== null && !pausedRef.current) {
        const delta = now - lastRef.current;
        if (delta > 0) tick(delta);
      }
      lastRef.current = now;
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick]);
}
