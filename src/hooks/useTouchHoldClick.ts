import { useEffect, useRef, type RefObject } from "react";
import { TOUCH_HOLD_DELAY_MS, TOUCH_HOLD_INTERVAL_MS } from "../game/config";

interface TouchHoldClickOptions {
  enabled: boolean;
  targetRef: RefObject<HTMLElement | null>;
  onClick: (x: number, y: number) => void;
}

export function useTouchHoldClick({
  enabled,
  targetRef,
  onClick,
}: TouchHoldClickOptions) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdingRef = useRef(false);
  const firedHoldRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const el = targetRef.current;
    if (!el) return;

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

    const fireAtCenter = () => {
      const rect = el.getBoundingClientRect();
      onClick(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      if (pointerIdRef.current !== null) return;

      pointerIdRef.current = event.pointerId;
      el.setPointerCapture(event.pointerId);
      holdingRef.current = true;
      firedHoldRef.current = false;
      clearHoldTimer();

      holdTimerRef.current = setTimeout(() => {
        firedHoldRef.current = true;
        fireAtCenter();
        intervalRef.current = setInterval(fireAtCenter, TOUCH_HOLD_INTERVAL_MS);
      }, TOUCH_HOLD_DELAY_MS);
    };

    const endHold = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;

      clearHoldTimer();
      clearIntervalClick();

      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }

      if (holdingRef.current && !firedHoldRef.current) {
        fireAtCenter();
      }

      holdingRef.current = false;
      firedHoldRef.current = false;
      pointerIdRef.current = null;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", endHold);
    el.addEventListener("pointercancel", endHold);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", endHold);
      el.removeEventListener("pointercancel", endHold);
      clearHoldTimer();
      clearIntervalClick();
      holdingRef.current = false;
      pointerIdRef.current = null;
    };
  }, [enabled, onClick, targetRef]);
}
