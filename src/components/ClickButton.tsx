import { useCallback, useRef } from "react";
import { motion } from "motion/react";
import { LuMousePointerClick } from "react-icons/lu";
import { useGameStore } from "../game/store";
import { isInputBlocked } from "../game/engine/click";

interface ClickButtonProps {
  disabled?: boolean;
  onActivate?: () => void;
}

export function ClickButton({ disabled, onActivate }: ClickButtonProps) {
  const click = useGameStore((s) => s.click);
  const blocked = useGameStore((s) => isInputBlocked(s.state));
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fireClick = useCallback(
    (x: number, y: number) => {
      if (disabled || blocked) return;
      onActivate?.();
      click(x, y);
    },
    [click, disabled, blocked, onActivate],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      fireClick(event.clientX, event.clientY);
    },
    [fireClick],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.code === "Space") return;
      if (event.code !== "Enter") return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      fireClick(rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [fireClick],
  );

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      className="click-button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || blocked}
      aria-label="クリック"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
    >
      <LuMousePointerClick className="click-button-icon" aria-hidden="true" />
      Click
    </motion.button>
  );
}

export function useClickButtonCenter(): () => void {
  const click = useGameStore((s) => s.click);
  const blocked = useGameStore((s) => isInputBlocked(s.state));

  return useCallback(() => {
    if (blocked) return;
    const button = document.querySelector<HTMLButtonElement>(".click-button");
    if (!button) return;
    const rect = button.getBoundingClientRect();
    click(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [click, blocked]);
}
