import { motion } from "motion/react";
import { IoTimerOutline } from "react-icons/io5";
import { formatSeconds } from "../game/format";

interface BonusTimeBannerProps {
  remainingMs: number;
  multiplier: number;
}

export function BonusTimeBanner({ remainingMs, multiplier }: BonusTimeBannerProps) {
  const active = remainingMs > 0;

  return (
    <motion.div
      className={`bonus-banner${active ? " active" : ""}`}
      role="status"
      aria-hidden={!active}
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : -4 }}
      transition={{ duration: 0.2 }}
    >
      <span className="bonus-banner-label">
        <IoTimerOutline aria-hidden="true" />
        ボーナスタイム
      </span>
      <span className="bonus-detail">
        ×{multiplier} · 残り {formatSeconds(remainingMs)}
      </span>
    </motion.div>
  );
}
