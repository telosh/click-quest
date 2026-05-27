import { useEffect, useState } from "react";

const IDLE_MS = 2000;

export function useIdleUi(lastActivityAt: number) {
  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsIdle(Date.now() - lastActivityAt >= IDLE_MS);
    };

    check();
    const timer = setInterval(check, 250);
    return () => clearInterval(timer);
  }, [lastActivityAt]);

  return isIdle;
}
