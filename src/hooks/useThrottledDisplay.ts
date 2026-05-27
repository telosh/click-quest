import { useEffect, useState } from "react";

export function useThrottledValue<T>(value: T, fps = 30): T {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let frame = 0;
    let last = 0;
    const interval = 1000 / fps;

    const tick = (now: number) => {
      if (now - last >= interval) {
        setDisplay(value);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, fps]);

  return display;
}
