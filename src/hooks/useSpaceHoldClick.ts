import { useEffect, useRef } from "react";
import { SPACE_HOLD_DELAY_MS, SPACE_HOLD_INTERVAL_MS } from "../game/config";

interface SpaceHoldClickOptions {
  enabled: boolean;
  mode: "playing" | "idle" | "cleared" | "blocked";
  onClick: () => void;
  onStart?: () => void;
  onRestart?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function useSpaceHoldClick({
  enabled,
  mode,
  onClick,
  onStart,
  onRestart,
}: SpaceHoldClickOptions) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdingRef = useRef(false);
  const firedHoldRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const clearHoldTimer = () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };

    const clearIntervalClick = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      clearHoldTimer();
      holdingRef.current = true;
      firedHoldRef.current = false;

      if (mode === "cleared") {
        onRestart?.();
        holdingRef.current = false;
        return;
      }

      if (mode === "idle") {
        onStart?.();
        holdingRef.current = false;
        return;
      }

      if (mode === "blocked") {
        holdingRef.current = false;
        return;
      }

      holdTimerRef.current = setTimeout(() => {
        firedHoldRef.current = true;
        onClick();
        intervalRef.current = setInterval(onClick, SPACE_HOLD_INTERVAL_MS);
      }, SPACE_HOLD_DELAY_MS);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;

      clearHoldTimer();
      clearIntervalClick();

      if (!holdingRef.current) return;
      holdingRef.current = false;

      if (mode !== "playing") return;

      if (!firedHoldRef.current) {
        onClick();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearHoldTimer();
      clearIntervalClick();
      holdingRef.current = false;
      firedHoldRef.current = false;
    };
  }, [enabled, mode, onClick, onRestart, onStart]);
}
