import { useEffect, useRef } from "react";
import { SPACE_CLICK_COOLDOWN_MS } from "../game/config";

interface GlobalClickOptions {
  enabled: boolean;
  onClick: () => void;
  onStart?: () => void;
  onRestart?: () => void;
  mode: "playing" | "idle" | "cleared" | "blocked";
}

export function useGlobalClick({
  enabled,
  onClick,
  onStart,
  onRestart,
  mode,
}: GlobalClickOptions) {
  const lastSpaceClickAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();

      if (mode === "cleared") {
        onRestart?.();
        return;
      }

      if (mode === "idle") {
        onStart?.();
        return;
      }

      if (mode === "blocked") return;

      const now = Date.now();
      if (now - lastSpaceClickAtRef.current < SPACE_CLICK_COOLDOWN_MS) return;

      lastSpaceClickAtRef.current = now;
      onClick();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, mode, onClick, onRestart, onStart]);
}
